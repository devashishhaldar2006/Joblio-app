import os
import datetime
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

load_dotenv()

mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/innovatex")
db_name = os.getenv("MONGO_DB_NAME", "innovatex")
client_mongo = MongoClient(mongo_uri)
db = client_mongo[db_name]

core_skills = {
    "Python": 55.4,
    "React": 52.3,
    "JavaScript": 50.1,
    "TypeScript": 46.8,
    "AWS": 43.5,
    "Docker": 41.2,
    "Node.js": 39.7,
    "PostgreSQL": 37.4,
    "SQL": 42.0,
    "Kubernetes": 32.8,
    "FastAPI": 29.5,
    "Next.js": 27.2,
    "Git": 54.0,
    "PyTorch": 25.6,
    "Linux": 36.5,
    "Redis": 23.4,
    "Java": 35.1,
    "Go": 21.3,
    "MongoDB": 28.9,
    "Terraform": 24.5,
    "GraphQL": 19.8,
    "Machine Learning": 31.0,
    "CI/CD": 38.0,
    "C++": 22.5,
    "C#": 20.1,
    "Tailwind CSS": 26.4,
    "Pandas": 23.0,
    "NumPy": 21.5,
    "dbt": 17.2,
    "Microservices": 33.0,
    "REST API": 49.0
}

current_wstart = datetime.datetime.now(datetime.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
current_wstart = current_wstart - datetime.timedelta(days=current_wstart.isoweekday() - 1)

operations = []
snapshot_ops = []

for w_idx in range(16, -1, -1):
    w_start = current_wstart - datetime.timedelta(days=7 * w_idx)
    top_for_week = []

    for s_name, curr_pct in core_skills.items():
        noise = float(np.sin(w_idx * 0.45 + hash(s_name) % 7) * 1.3)
        trend_slope = -0.16 * w_idx
        hist_pct = round(max(0.5, curr_pct + trend_slope + noise), 2)
        count = int(round((hist_pct / 100.0) * 100))

        operations.append(
            UpdateOne(
                {"skill_name": s_name, "week_start": w_start},
                {"$set": {
                    "skill_name": s_name,
                    "week_start": w_start,
                    "count": count,
                    "percentage_of_total": hist_pct,
                    "total_jobs_that_week": 100,
                    "collected_at": datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
                }},
                upsert=True
            )
        )
        top_for_week.append({"skill": s_name, "percentage": hist_pct, "count": count, "wow_change": round(noise, 1)})

    top_for_week.sort(key=lambda x: x["percentage"], reverse=True)
    snapshot_ops.append(
        UpdateOne(
            {"week_start": w_start},
            {"$set": {
                "week_start": w_start,
                "total_jobs_collected": 100,
                "top_skills": top_for_week[:20],
                "emerging_skills": ["vLLM", "Mamba", "Ollama", "CrewAI", "ChromaDB"],
                "co_occurrences": {
                    "Python": ["Docker", "FastAPI", "PostgreSQL", "AWS", "PyTorch"],
                    "React": ["TypeScript", "Next.js", "Tailwind CSS", "Node.js", "GraphQL"],
                    "Docker": ["Kubernetes", "AWS", "Linux", "CI/CD", "Terraform"]
                },
                "collected_at": datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            }},
            upsert=True
        )
    )

print(f"Executing bulk write with {len(operations)} skill datapoints and {len(snapshot_ops)} snapshots...")
res1 = db["skilldatapoints"].bulk_write(operations)
res2 = db["marketsnapshots"].bulk_write(snapshot_ops)
print(f"Bulk write done! Matched: {res1.matched_count}, Upserted: {len(res1.upserted_ids)}")
print("Total documents in skilldatapoints:", db["skilldatapoints"].count_documents({}))
print("Total documents in marketsnapshots:", db["marketsnapshots"].count_documents({}))
