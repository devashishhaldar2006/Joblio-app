# InnovateX API Contract (Frozen)

## Auth (`/api/auth`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` | AuthContext |
| POST | `/auth/register` | `{ name, email, password }` | `{ token, user }` | AuthContext |
| GET | `/auth/profile` | Bearer token | `{ user }` | ProfilePage, Market |
| PUT | `/auth/profile` | `{ name, skills, githubUsername }` | `{ user }` | ProfilePage |
| PUT | `/auth/password` | `{ currentPassword, newPassword }` | `{ success }` | ProfilePage |

## GitHub (`/api/github`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| POST | `/github/analyze` | `{ username, forceSync? }` | `{ profile, metrics }` | GithubAnalyzer |
| GET | `/github/latest` | `?username=` | `{ profile }` | GithubAnalyzer, Palette |
| GET | `/github/history` | `?username=` | `[ { profile } ]` | Github, Reports, Profile |
| PATCH | `/github/state` | `{ username, selectedGoal?, actionStates? }` | `{ profile }` | GithubAnalyzer |
| POST | `/github/ai-generate`| `{ username, actionType, context }` | `{ output }` | AIActionModal |
| POST | `/github/ai-ask` | `{ question, context }` | `{ answer }` | CommandPalette |

## Contests (`/api/contests`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| GET | `/contests` | `?platform=&status=` | `{ contests: [...] }` | Contests, Dashboard |
| POST | `/contests/personalized` | `{ skill_level }` | `{ recommended: [...] }` | Contests |

## Market (`/api/market`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| GET | `/market/trending` | — | `{ trending: [...] }` | MarketPage |
| GET | `/market/history/:skill` | — | `{ history: [...] }` | MarketPage |
| POST | `/market/forecast` | `{ skill, timeframe }` | `{ forecast: [...] }` | MarketPage |
| POST | `/market/gap-report` | `{ skills }` | `{ report }` | MarketPage |

## Open Source (`/api/opensource`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| POST | `/opensource/find` | `{ skills, languages, difficulty }` | `{ issues: [...] }` | OpenSourcePage |
| POST | `/opensource/guide` | `{ issue_url, context }` | `{ blueprint }` | OpenSourcePage |
| POST | `/opensource/review` | `{ code, issue_context }` | `{ review }` | OpenSourcePage |
| GET | `/opensource/history` | — | `{ history: [...] }` | Reports, Profile |
| POST | `/opensource/bookmark` | `{ issue }` | `{ bookmark }` | OpenSourcePage |

## Research (`/api/research`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| POST | `/research/explain` | `{ input }` | `{ paper, analysis }` | ResearchPage |
| GET | `/research/history` | — | `{ history: [...] }` | Reports, Profile |

## Jobs (`/api/jobs`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| POST | `/jobs/search` | FormData (resume + fields) | `{ jobs: [...], match }` | JobSearchPage |
| GET | `/jobs/history` | — | `{ history: [...] }` | JobSearch, Reports |
| POST | `/jobs/bookmark` | `{ job, searchId }` | `{ bookmark }` | JobSearchPage |
| GET | `/jobs/bookmarks` | — | `{ bookmarks: [...] }` | JobSearch, Profile |
| PATCH| `/jobs/bookmark/:id/status` | `{ status }` or `{ notes }` | `{ bookmark }` | JobSearchPage |
| DELETE | `/jobs/bookmark/:id` | — | `{ success }` | JobSearchPage |

## Reports (`/api/reports`)
| Method | Endpoint | Payload | Response | Used By |
|---|---|---|---|---|
| GET | `/reports` | — | `{ reports: [...] }` | ReportsPage |
| DELETE | `/reports/:type/:id` | — | `{ success }` | ReportsPage |
