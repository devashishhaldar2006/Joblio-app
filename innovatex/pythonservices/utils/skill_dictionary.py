"""
Comprehensive curated dictionary of 500+ technology and developer skills organized by category,
with aliases and normalization mappings for exact-match and NLP skill extraction.
"""

from typing import Dict, List, Set

SKILLS: Dict[str, List[str]] = {
    "languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C",
        "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
        "R", "MATLAB", "Perl", "Dart", "Elixir", "Haskell", "Julia",
        "Lua", "Shell", "Bash", "Groovy", "Clojure", "Erlang", "F#",
        "OCaml", "Zig", "Fortran", "COBOL", "Solidity", "Vyper", "Assembly",
        "VHDL", "Verilog", "Apex", "PowerShell", "Racket", "Nim", "Ada",
        "ActionScript", "VBA", "Visual Basic", "CoffeeScript", "D", "Tcl"
    ],
    "frontend": [
        "React", "Vue", "Angular", "Next.js", "Nuxt.js", "Svelte", "SvelteKit",
        "Redux", "Zustand", "MobX", "Recoil", "Tailwind CSS", "Bootstrap",
        "jQuery", "Webpack", "Vite", "Rollup", "Parcel", "Babel", "TurboPack",
        "GraphQL", "REST API", "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS",
        "LESS", "PostCSS", "Styled Components", "Emotion", "Chakra UI",
        "Material UI", "MUI", "Shadcn", "Radix UI", "Ant Design", "Storybook",
        "Three.js", "Babylon.js", "D3.js", "Chart.js", "Recharts", "ECharts",
        "Canvas API", "WebGL", "WebAssembly", "Wasm", "PWA", "Service Workers",
        "WebSockets", "Server-Sent Events", "Micro Frontends", "Alpine.js",
        "Lit", "Stencil", "Shadow DOM", "Remix", "Astro", "Gatsby", "Bulma",
        "Foundation", "Semantic UI", "Tailwind UI", "Headless UI", "DaisyUI"
    ],
    "backend": [
        "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot",
        "Spring Framework", "Laravel", "Ruby on Rails", "Rails", "ASP.NET",
        "ASP.NET Core", ".NET Core", "NestJS", "Gin", "Fiber", "Echo",
        "gRPC", "WebSockets", "Microservices", "REST", "RESTful APIs",
        "GraphQL", "Celery", "BullMQ", "Sidekiq", "Apache Kafka", "Kafka",
        "RabbitMQ", "Redis Pub/Sub", "ZeroMQ", "Socket.io", "Apache Pulsar",
        "Event-Driven Architecture", "CQRS", "tRPC", "Actix", "Axum", "Rocket",
        "Phoenix", "Koa", "Hapi", "Fastify", "Tornado", "Sanic", "Quarkus",
        "Micronaut", "Ktor", "Vert.x", "Swoole", "Phalcon", "Symfony", "CakePHP",
        "CodeIgniter", "Sinatra", "Hanami", "FeathersJS", "AdonisJS"
    ],
    "ai_ml": [
        "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing",
        "Computer Vision", "LangChain", "LangGraph", "LlamaIndex", "RAG",
        "Retrieval-Augmented Generation", "Fine-tuning", "PyTorch", "TensorFlow",
        "Keras", "scikit-learn", "XGBoost", "LightGBM", "CatBoost", "HuggingFace",
        "OpenAI", "Anthropic", "Gemini", "Mistral", "Llama", "Vector Database",
        "ChromaDB", "Pinecone", "Milvus", "Qdrant", "Weaviate", "FAISS",
        "Embeddings", "Transformers", "Stable Diffusion", "Diffusion Models",
        "GAN", "CNN", "RNN", "LSTM", "BERT", "GPT", "LLM", "Large Language Models",
        "MLOps", "MLflow", "Kubeflow", "Weights & Biases", "DVC", "vLLM", "Ollama",
        "TensorRT", "ONNX", "AutoGen", "CrewAI", "Semantic Kernel", "LoRA", "QLoRA",
        "Reinforcement Learning", "RLHF", "DPO", "Prompt Engineering", "OpenCV",
        "Spacy", "NLTK", "Gensim", "Fastai", "Jax", "Flax", "Ray", "Triton Server",
        "DeepSpeed", "Megatron-LM", "Whisper", "Speech Recognition", "Audio Processing",
        "Time Series Forecasting", "Prophet", "ARIMA", "SARIMA", "Graph Neural Networks",
        "Feature Engineering", "Data Augmentation", "Supervised Learning", "Unsupervised Learning"
    ],
    "cloud": [
        "AWS", "Azure", "GCP", "Google Cloud Platform", "Docker", "Kubernetes",
        "Terraform", "CloudFormation", "Pulumi", "CI/CD", "GitHub Actions",
        "GitLab CI", "Jenkins", "ArgoCD", "Helm", "Ansible", "CircleCI",
        "AWS Lambda", "EC2", "S3", "RDS", "DynamoDB", "ECS", "EKS", "CloudFront",
        "Route 53", "IAM", "CloudWatch", "Azure Functions", "Cloud Run", "BigQuery",
        "Vercel", "Netlify", "Heroku", "DigitalOcean", "Linux", "OpenShift",
        "Nomad", "Consul", "Vault", "Istio", "Envoy", "Serverless", "Knative",
        "AWS Step Functions", "AWS SQS", "AWS SNS", "AWS Glue", "AWS Redshift",
        "AWS Fargate", "Google Compute Engine", "Google Kubernetes Engine",
        "Azure DevOps", "Azure Blob Storage", "Azure Cosmos DB", "Traefik",
        "Cloudflare Workers", "Akamai", "Fastly", "Linode", "Hetzner"
    ],
    "databases": [
        "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "OpenSearch",
        "Cassandra", "DynamoDB", "SQLite", "Oracle", "Neo4j", "InfluxDB",
        "TimescaleDB", "Snowflake", "BigQuery", "Databricks", "ClickHouse",
        "CockroachDB", "CouchDB", "Couchbase", "Supabase", "Firebase",
        "Firebase Firestore", "Realm", "MariaDB", "TiDB", "ScyllaDB", "ArangoDB",
        "Memcached", "SingleStore", "DuckDB", "Chroma", "Milvus", "Weaviate",
        "pgvector", "Vector Search", "dbt", "Apache Cassandra", "HBase",
        "Amazon Aurora", "Amazon DocumentDB", "FaunaDB", "HarperDB", "RavenDB",
        "SurrealDB", "RocksDB", "LevelDB", "SQL Server", "Microsoft SQL Server"
    ],
    "data": [
        "Pandas", "NumPy", "Apache Spark", "PySpark", "Apache Hadoop", "Hadoop",
        "Apache Airflow", "Airflow", "Apache Flink", "Flink", "dbt", "Apache Beam",
        "Presto", "Trino", "Tableau", "Power BI", "Looker", "Metabase",
        "Data Engineering", "ETL", "ELT", "Data Science", "Statistics",
        "A/B Testing", "SQL", "NoSQL", "Data Lakes", "Data Warehouses",
        "Apache Iceberg", "Delta Lake", "Apache Hudi", "Hive", "Redshift",
        "Athena", "Polars", "Dask", "Ray", "Great Expectations", "Dagster",
        "Prefect", "Kafka Streams", "Debezium", "Data Modeling", "OLAP", "OLTP",
        "Data Quality", "Data Governance", "Apache Arrow", "Parquet", "Avro"
    ],
    "mobile": [
        "React Native", "Flutter", "iOS", "Android", "Swift", "SwiftUI",
        "Objective-C", "Kotlin", "Android Studio", "Xcode", "Jetpack Compose",
        "Xamarin", "Ionic", "Expo", "Capacitor", "Cordova", "Mobile App Development",
        "App Store", "Google Play", "Fastlane", "NativeScript", "CoreData",
        "Room Database", "Realm Mobile", "Mobile UI", "KMM", "Kotlin Multiplatform"
    ],
    "devops_security": [
        "DevSecOps", "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk",
        "ELK Stack", "Logstash", "Kibana", "Jaeger", "OpenTelemetry", "Sentry",
        "SonarQube", "Snyk", "Trivy", "OWASP", "Penetration Testing", "IAM",
        "OAuth", "OAuth2", "OpenID Connect", "JWT", "SAML", "SSL/TLS",
        "Zero Trust", "CIS Benchmarks", "HashiCorp Vault", "Falco", "WireGuard",
        "Nginx", "Apache", "Traefik", "Caddy", "HAProxy", "WAF", "Burp Suite",
        "Security Auditing", "Vulnerability Scanning", "AppSec", "Cloud Security",
        "Cryptography", "Public Key Infrastructure", "SIEM", "SOC 2", "HIPAA"
    ],
    "testing": [
        "Jest", "Cypress", "Playwright", "Selenium", "Puppeteer", "Mocha",
        "Chai", "Vitest", "PyTest", "Unittest", "JUnit", "TestNG", "Mockito",
        "Postman", "Newman", "Karate", "K6", "Locust", "JMeter", "TDD", "BDD",
        "End-to-End Testing", "Unit Testing", "Integration Testing", "Load Testing",
        "Regression Testing", "Stress Testing", "Mutation Testing", "Cucumber",
        "Robot Framework", "Detox", "Appium", "Test Automation"
    ],
    "tools": [
        "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Linear",
        "Trello", "Agile", "Scrum", "Kanban", "Figma", "Postman", "Insomnia",
        "VS Code", "IntelliJ IDEA", "PyCharm", "WebStorm", "Linux", "Bash",
        "PowerShell", "Zsh", "Vim", "Neovim", "Tmux", "Docker Compose",
        "Make", "CMake", "Maven", "Gradle", "NPM", "Yarn", "PNPM", "Poetry",
        "Pipenv", "Conda", "Homebrew", "Notion", "Slack", "Asana"
    ],
    "architecture_systems": [
        "System Design", "Distributed Systems", "Domain-Driven Design", "DDD",
        "Clean Architecture", "Hexagonal Architecture", "Event-Driven Architecture",
        "High Availability", "Load Balancing", "Caching Strategies", "Database Sharding",
        "Database Indexing", "Concurrency", "Multithreading", "Asynchronous Programming",
        "Object-Oriented Programming", "OOP", "Functional Programming", "API Design",
        "Design Patterns", "Cloud Native", "Disaster Recovery", "Zero Downtime Deployments",
        "Scalability", "Fault Tolerance", "Service Mesh", "Microservices Architecture"
    ]
}

SKILL_ALIASES: Dict[str, str] = {
    "js": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "k8s": "Kubernetes",
    "tf": "Terraform",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "cv": "Computer Vision",
    "nlp": "NLP",
    "react.js": "React",
    "reactjs": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "vue.js": "Vue",
    "vuejs": "Vue",
    "angular.js": "Angular",
    "angularjs": "Angular",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "aws lambda": "AWS Lambda",
    "lambda": "AWS Lambda",
    "next": "Next.js",
    "nextjs": "Next.js",
    "nuxt": "Nuxt.js",
    "nuxtjs": "Nuxt.js",
    "express.js": "Express",
    "expressjs": "Express",
    "fastapi": "FastAPI",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "ror": "Ruby on Rails",
    "golang": "Go",
    "c sharp": "C#",
    "dotnet": "ASP.NET",
    ".net": "ASP.NET",
    ".net core": "ASP.NET Core",
    "scikit": "scikit-learn",
    "sklearn": "scikit-learn",
    "tf.keras": "Keras",
    "elastic": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "k8": "Kubernetes",
    "gcp": "GCP",
    "google cloud": "GCP",
    "ms azure": "Azure",
    "dynamo": "DynamoDB",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "rest": "REST API",
    "restful": "REST API",
    "rest apis": "REST API",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "actions": "GitHub Actions",
    "rn": "React Native",
    "react-native": "React Native",
    "llms": "LLM",
    "large language model": "LLM",
    "genai": "Generative AI",
    "gen ai": "Generative AI",
    "generative ai": "Generative AI"
}

# Add Generative AI to ai_ml
if "Generative AI" not in SKILLS["ai_ml"]:
    SKILLS["ai_ml"].append("Generative AI")

def get_all_skills() -> List[str]:
    """Return deduplicated list of all skills across all categories."""
    seen: Set[str] = set()
    result: List[str] = []
    for category_skills in SKILLS.values():
        for skill in category_skills:
            norm = skill.strip()
            if norm and norm.lower() not in seen:
                seen.add(norm.lower())
                result.append(norm)
    return result

def normalize_skill(skill_name: str) -> str:
    """Normalize skill name using aliases or case-insensitive matching."""
    if not skill_name:
        return ""
    cleaned = skill_name.strip()
    low = cleaned.lower()
    if low in SKILL_ALIASES:
        return SKILL_ALIASES[low]
    
    # Check against exact skills
    for category, skills in SKILLS.items():
        for s in skills:
            if s.lower() == low:
                return s
    return cleaned

TOTAL_SKILLS_COUNT = len(get_all_skills())
