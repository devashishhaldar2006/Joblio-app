"""
Auto-Selecting ML Forecast Engine for Skill Demand.
Automatically selects between Facebook Prophet (>=16 weeks), ARIMA (>=12 weeks),
or Linear Regression (>=4 weeks) with confidence intervals and boundary guards.
"""

import warnings
import datetime
import logging
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

from agents.market.timeseries_builder import build_skill_timeseries, parse_date, week_str_from_date

warnings.filterwarnings('ignore')
logger = logging.getLogger("market.forecast_engine")

def week_to_datetime(week_str: str, fallback_date_str: str = None) -> datetime.datetime:
    """Converts 'YYYY-Www' or date string to a concrete Monday datetime."""
    if fallback_date_str:
        try:
            return parse_date(fallback_date_str)
        except Exception:
            pass
    try:
        if "-W" in week_str:
            parts = week_str.split("-W")
            year = int(parts[0])
            week = int(parts[1])
            # Monday of that ISO week
            return datetime.datetime.fromisocalendar(year, week, 1)
    except Exception:
        pass
    return datetime.datetime.now()

def _run_prophet_forecast(
    weeks: List[str],
    dates: List[str],
    percentages: List[float],
    weeks_ahead: int
) -> Tuple[List[Dict[str, Any]], float]:
    """Runs Facebook Prophet model with weekly seasonality."""
    from prophet import Prophet

    ds_list = [week_to_datetime(w, d) for w, d in zip(weeks, dates)]
    df = pd.DataFrame({'ds': ds_list, 'y': percentages})

    # Tune Prophet for weekly skill demand series (additive mode, no intra-week seasonality)
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode='additive',
        changepoint_prior_scale=0.05,
        interval_width=0.80
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=weeks_ahead, freq='7D')
    forecast = model.predict(future)

    tail = forecast.tail(weeks_ahead)
    yhat = np.clip(tail['yhat'].values, 0.0, 100.0)
    lower = np.clip(tail['yhat_lower'].values, 0.0, yhat)
    upper = np.clip(tail['yhat_upper'].values, yhat, 100.0)

    mean_yhat = float(np.mean(yhat)) if np.mean(yhat) > 0 else 1.0
    conf_spread = float(np.mean(upper - lower))
    raw_confidence = 1.0 - (conf_spread / (2.0 * mean_yhat))
    confidence = float(np.clip(raw_confidence, 0.45, 0.95))

    last_dt = ds_list[-1]
    forecast_series: List[Dict[str, Any]] = []
    for step in range(weeks_ahead):
        step_dt = last_dt + datetime.timedelta(days=7 * (step + 1))
        forecast_series.append({
            "week": week_str_from_date(step_dt),
            "date": step_dt.strftime("%Y-%m-%d"),
            "predicted": round(float(yhat[step]), 2),
            "lower": round(float(lower[step]), 2),
            "upper": round(float(upper[step]), 2)
        })

    return forecast_series, round(confidence, 2)

def _run_arima_forecast(
    weeks: List[str],
    dates: List[str],
    percentages: List[float],
    weeks_ahead: int
) -> Tuple[List[Dict[str, Any]], float]:
    """Runs Auto-ARIMA model with stationarity test and AIC grid selection."""
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.stattools import adfuller

    # Test stationarity
    try:
        adf_result = adfuller(percentages)
        d = 0 if adf_result[1] < 0.05 else 1
    except Exception:
        d = 1

    # Grid search p, q using AIC
    best_aic = float('inf')
    best_order = (1, d, 1)

    for p in range(0, 3):
        for q in range(0, 3):
            try:
                model = ARIMA(percentages, order=(p, d, q))
                result = model.fit()
                if result.aic < best_aic:
                    best_aic = result.aic
                    best_order = (p, d, q)
            except Exception:
                continue

    try:
        final_model = ARIMA(percentages, order=best_order)
        result = final_model.fit()
        forecast_res = result.get_forecast(steps=weeks_ahead)
        preds = np.clip(forecast_res.predicted_mean, 0.0, 100.0)
        conf_int = forecast_res.conf_int(alpha=0.20)  # 80% interval
        
        if isinstance(conf_int, pd.DataFrame):
            lower_vals = np.clip(conf_int.iloc[:, 0].values, 0.0, preds)
            upper_vals = np.clip(conf_int.iloc[:, 1].values, preds, 100.0)
        else:
            lower_vals = np.clip(conf_int[:, 0], 0.0, preds)
            upper_vals = np.clip(conf_int[:, 1], preds, 100.0)

        mean_pred = float(np.mean(preds)) if np.mean(preds) > 0 else 1.0
        conf_spread = float(np.mean(upper_vals - lower_vals))
        raw_confidence = 1.0 - (conf_spread / (2.0 * mean_pred))
        confidence = float(np.clip(raw_confidence, 0.40, 0.90))

    except Exception as e:
        logger.warning(f"ARIMA fit fallback: {e}")
        return _run_linear_regression_forecast(weeks, dates, percentages, weeks_ahead)

    last_dt = week_to_datetime(weeks[-1], dates[-1])
    forecast_series: List[Dict[str, Any]] = []
    for step in range(weeks_ahead):
        step_dt = last_dt + datetime.timedelta(days=7 * (step + 1))
        forecast_series.append({
            "week": week_str_from_date(step_dt),
            "date": step_dt.strftime("%Y-%m-%d"),
            "predicted": round(float(preds[step]), 2),
            "lower": round(float(lower_vals[step]), 2),
            "upper": round(float(upper_vals[step]), 2)
        })

    return forecast_series, round(confidence, 2)

def _run_linear_regression_forecast(
    weeks: List[str],
    dates: List[str],
    percentages: List[float],
    weeks_ahead: int
) -> Tuple[List[Dict[str, Any]], float]:
    """Runs Linear Regression fallback with standard error bounds."""
    from sklearn.linear_model import LinearRegression

    n = len(percentages)
    X = np.arange(n).reshape(-1, 1)
    y = np.array(percentages)

    model = LinearRegression()
    model.fit(X, y)

    future_X = np.arange(n, n + weeks_ahead).reshape(-1, 1)
    preds = np.clip(model.predict(future_X), 0.0, 100.0)

    # Compute residual variance for confidence intervals
    fitted = model.predict(X)
    residuals = y - fitted
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else 0.5
    # Expand interval with forecast horizon
    horizon_factor = 1.28 * residual_std  # ~80% confidence interval

    r2 = model.score(X, y)
    confidence = float(np.clip(max(0.35, r2), 0.35, 0.75))

    last_dt = week_to_datetime(weeks[-1], dates[-1])
    forecast_series: List[Dict[str, Any]] = []
    for step in range(weeks_ahead):
        step_dt = last_dt + datetime.timedelta(days=7 * (step + 1))
        pred_val = float(preds[step])
        spread = horizon_factor * (1.0 + 0.02 * step)
        lower_val = max(0.0, min(pred_val, pred_val - spread))
        upper_val = min(100.0, max(pred_val, pred_val + spread))

        forecast_series.append({
            "week": week_str_from_date(step_dt),
            "date": step_dt.strftime("%Y-%m-%d"),
            "predicted": round(pred_val, 2),
            "lower": round(lower_val, 2),
            "upper": round(upper_val, 2)
        })

    return forecast_series, round(confidence, 2)

def forecast_skill(skill: str, weeks_ahead: int = 26, timeseries_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main ML Forecasting entry point.
    Loads timeseries, evaluates length, selects model (Prophet, ARIMA, or Linear Regression),
    and generates 26-week forecast with confidence intervals.
    """
    if timeseries_data is None:
        timeseries_data = build_skill_timeseries(skill)

    skill_name = timeseries_data.get("skill", skill)
    ts = timeseries_data.get("timeseries", [])
    weeks_of_data = len(ts)

    # Check minimum data threshold requirement
    if weeks_of_data < 4:
        return {
            "skill": skill_name,
            "insufficient_data": True,
            "weeks_of_data": weeks_of_data,
            "message": f"Not enough data yet — check back in {4 - weeks_of_data} weeks",
            "model_used": "none",
            "current_percentage": ts[-1]["percentage"] if ts else 0.0,
            "forecast_percentage_6m": ts[-1]["percentage"] if ts else 0.0,
            "confidence": 0.0,
            "forecast_series": [],
            "historical_series": [{"week": item["week"], "actual": item["percentage"]} for item in ts]
        }

    weeks = [item["week"] for item in ts]
    dates = [item.get("date", "") for item in ts]
    percentages = [float(item["percentage"]) for item in ts]
    current_percentage = percentages[-1]

    # Auto-select model based on length of collected time series
    model_used = "linear_regression"
    forecast_series: List[Dict[str, Any]] = []
    confidence = 0.50

    try:
        if weeks_of_data >= 16:
            try:
                forecast_series, confidence = _run_prophet_forecast(weeks, dates, percentages, weeks_ahead)
                model_used = "prophet"
            except Exception as pe:
                logger.warning(f"Prophet failed, falling back to ARIMA: {pe}")
                forecast_series, confidence = _run_arima_forecast(weeks, dates, percentages, weeks_ahead)
                model_used = "arima"
        elif weeks_of_data >= 12:
            try:
                forecast_series, confidence = _run_arima_forecast(weeks, dates, percentages, weeks_ahead)
                model_used = "arima"
            except Exception as ae:
                logger.warning(f"ARIMA failed, falling back to Linear Regression: {ae}")
                forecast_series, confidence = _run_linear_regression_forecast(weeks, dates, percentages, weeks_ahead)
                model_used = "linear_regression"
        else:
            forecast_series, confidence = _run_linear_regression_forecast(weeks, dates, percentages, weeks_ahead)
            model_used = "linear_regression"

    except Exception as e:
        logger.error(f"Forecasting error for {skill_name}: {e}")
        forecast_series, confidence = _run_linear_regression_forecast(weeks, dates, percentages, weeks_ahead)
        model_used = "linear_regression"

    forecast_6m = forecast_series[-1]["predicted"] if forecast_series else current_percentage

    return {
        "skill": skill_name,
        "insufficient_data": False,
        "model_used": model_used,
        "weeks_of_data": weeks_of_data,
        "weeks_ahead": weeks_ahead,
        "current_percentage": round(current_percentage, 2),
        "forecast_percentage_6m": round(forecast_6m, 2),
        "confidence": confidence,
        "forecast_series": forecast_series,
        "historical_series": [
            {"week": item["week"], "date": item.get("date", ""), "actual": item["percentage"]}
            for item in ts
        ]
    }
