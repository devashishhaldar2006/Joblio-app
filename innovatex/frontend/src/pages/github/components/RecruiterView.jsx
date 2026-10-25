import React from 'react';
import {
  ExternalLink, CheckCircle2, Globe, MapPin, Building2,
  ShieldCheck
} from 'lucide-react';

export default function RecruiterView({ report, onSelectRepo }) {
  if (!report) return null;

  const profile = report.profile || {};
  const username = report.username || profile.login || profile.username || '';
  const repoAnalysis = report.repo_analysis || {};
  const devDna = report.developer_dna || repoAnalysis.developer_dna || [];
  const techList = report.detected_technologies || repoAnalysis.detected_technologies || [];
  const featured =
    report.featured_candidates ||
    repoAnalysis.project_depth?.featured_candidates ||
    [];
  const activity = report.activity_intelligence || repoAnalysis.activity_intelligence || {};
  const comm = report.community_intelligence || repoAnalysis.community_intelligence || {};
  const repos = report.repositories || repoAnalysis.repositories || [];

  const topDomains = devDna.filter((d) => (d.strength ?? d.score ?? 0) >= 20).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Factual Recruiter Notice Banner */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={16} color="#06b6d4" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            <strong>Recruiter Presentation Mode</strong> — Factual summary synthesized strictly from observable public GitHub repositories, languages, and commit telemetry.
          </span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            color: '#22d3ee',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Methodology {report.methodologyVersion || 'v2.1'}
        </span>
      </div>

      {/* Candidate Identity Summary */}
      <div
        style={{
          padding: '20px 22px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {(report.avatar_url || profile.avatar_url) && (
            <img
              src={report.avatar_url || profile.avatar_url}
              alt={username}
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}
            />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {report.name || profile.name || username}
              </h2>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                @{username}
              </span>
            </div>
            <p style={{ margin: '6px 0 10px', fontSize: '0.83rem', color: 'var(--text-secondary)', maxWidth: 680 }}>
              {report.bio || profile.bio || 'No public bio listed on GitHub profile.'}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              {(report.location || profile.location) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {report.location || profile.location}
                </span>
              )}
              {(report.company || profile.company) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={12} /> {report.company || profile.company}
                </span>
              )}
              {(report.blog || profile.blog) && (
                <a
                  href={
                    (report.blog || profile.blog).startsWith('http')
                      ? report.blog || profile.blog
                      : `https://${report.blog || profile.blog}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#22d3ee',
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={12} /> Portfolio / Website <ExternalLink size={11} />
                </a>
              )}
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                github.com/{username} <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Key Factual Counters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Public Health Score',
              value: `${report.totalScore ?? report.overall_score ?? 0}/100`,
            },
            { label: 'Original Repos', value: repos.length },
            { label: 'Verified Technologies', value: techList.length },
            {
              label: 'Active Repos (90d)',
              value:
                repoAnalysis.repos_pushed_90d ??
                (activity.active_repositories || []).length ??
                0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                minWidth: 115,
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: 3,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Focus & Verified Stack */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 12,
            }}
          >
            Observed Technical Focus (Evidence-Backed)
          </div>
          {topDomains.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topDomains.map((dom) => {
                const domainName = dom.category || dom.domain;
                const strengthVal = dom.strength ?? dom.score ?? 0;
                return (
                  <div key={domainName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {domainName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: '#22d3ee',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Signal strength: {strengthVal}/100
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Evidence: {(dom.evidence || []).slice(0, 2).join(' • ')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Insufficient public repository evidence to classify primary technical focus areas.
            </div>
          )}
        </div>

        <div
          style={{
            padding: '18px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 12,
            }}
          >
            Verified Technologies & Ecosystems ({techList.length})
          </div>
          {techList.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {techList.map((tech) => {
                const cnt = tech.count ?? tech.repo_count ?? (tech.repositories || []).length;
                return (
                  <div
                    key={tech.name}
                    style={{
                      padding: '6px 10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tech.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#06b6d4',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ({cnt} {cnt === 1 ? 'repo' : 'repos'})
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No specific framework or language signatures detected.
            </div>
          )}
        </div>
      </div>

      {/* Featured Projects */}
      <div
        style={{
          padding: '18px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 14,
          }}
        >
          Featured Project Candidates (Ranked by Engineering Depth & Documentation)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {(featured.length > 0 ? featured : repos.slice(0, 4)).map((proj) => {
            const reasons = proj.standout_reasons || proj.why_stands_out || [];
            return (
              <div
                key={proj.name}
                style={{
                  padding: 16,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() => {
                        const fullRepo = repos.find((r) => r.name === proj.name) || proj;
                        onSelectRepo?.(fullRepo);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#22d3ee',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {proj.name}
                    </button>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Health {proj.health_score ?? proj.depth_score ?? 0}/100
                    </span>
                  </div>

                  <p style={{ margin: '6px 0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {proj.description || 'No description provided.'}
                  </p>

                  {reasons.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {reasons.slice(0, 4).map((reason, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <CheckCircle2 size={12} color="#10b981" /> {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10,
                    fontSize: '0.73rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>{proj.language || 'Code'}</span>
                  {proj.html_url && (
                    <a
                      href={proj.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      GitHub <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Public Activity & Community Signals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 10,
            }}
          >
            Recent Public Activity Summary
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
            <div>
              • Active repositories in last 90 days:{' '}
              <strong>{repoAnalysis.repos_pushed_90d ?? (activity.active_repositories || []).length ?? 0}</strong>
            </div>
            <div>• Most active period: <strong>{activity.most_active_period || 'N/A'}</strong></div>
            <div>
              • Recent public events observed:{' '}
              <strong>{activity.event_breakdown?.total_public_events ?? 0}</strong>
            </div>
            {(activity.insights || []).map((ins, i) => (
              <div key={i} style={{ color: 'var(--text-secondary)' }}>• {ins}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 10,
            }}
          >
            Public Community Signals
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10, fontSize: '0.79rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            <span>Followers: {comm.followers ?? report.followers ?? 0}</span>
            <span>Stars received: {comm.stars_received ?? report.total_stars ?? 0}</span>
            <span>Forks: {comm.forks_received ?? report.total_forks ?? 0}</span>
            <span>PR events: {comm.pr_participation ?? 0}</span>
          </div>
          <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {comm.interpretation || 'Public community metrics reflect observable repository interactions.'}
          </div>
        </div>
      </div>
    </div>
  );
}
