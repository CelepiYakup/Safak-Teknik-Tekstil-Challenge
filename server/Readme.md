# Factory Production Schedule - Backend API

A Flask-based REST API for managing factory work orders and operations with scheduling constraints and validation rules.

##  Tech Stack

- **Framework**: Flask 3.1.2
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Flask-Migrate (Alembic)
- **CORS**: Flask-CORS
- **Environment**: Python-dotenv
- **Database Driver**: psycopg2-binary

##  Features

- Work Order and Operation management
- Real-time scheduling validation
- Precedence and conflict detection
- Machine lane exclusivity
- Time-based constraints (no past scheduling)
- RESTful API endpoints
- Database migrations
- Comprehensive error handling

##  Project Structure

```
server/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration settings
│   ├── extensions.py        # Flask extensions (SQLAlchemy, CORS, etc.)
│   ├── models.py            # Database models
│   ├── rules.py             # Business logic and validation rules
│   ├── cli.py               # CLI commands for seeding data
│   └── api/
│       ├── __init__.py      # API blueprint registration
│       ├── work_orders.py   # Work orders endpoints
│       └── operations.py    # Operations endpoints
├── migrations/              # Database migration files
├── seeds/                   # Sample data files
├── requirements.txt         # Python dependencies
├── manage.py               # Application entry point
└── .env.example            # Environment variables template
```

##  Installation & Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### 1. Clone and Navigate

```bash
cd server
```

### 2. Create Virtual Environment

```bash
python -m venv venv


venv\Scripts\activate


source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file with your database configuration:

```bash
SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/factory_schedule
CORS_ORIGINS=http://localhost:5173
```

### 5. Database Setup

```bash

flask db init


flask db upgrade

flask seed
```

### 6. Run the Application

```bash

python manage.py


flask run
```

The API will be available at `http://localhost:5000`

##  API Endpoints

### Work Orders

#### GET /api/work-orders
Retrieve all work orders with their operations.

**Response:**
```json
[
  {
    "id": "WO-1001",
    "product": "Widget A",
    "qty": 100,
    "operations": [
      {
        "id": "OP-1",
        "workOrderId": "WO-1001",
        "index": 1,
        "machineId": "M1",
        "name": "Cut",
        "start": "2025-08-20T09:00:00Z",
        "end": "2025-08-20T10:00:00Z"
      }
    ]
  }
]
```

### Operations

#### PATCH /api/operations/{op_id}
Update an operation's start and end times.

**Request Body:**
```json
{
  "start": "2025-08-20T10:00:00Z",
  "end": "2025-08-20T11:00:00Z"
}
```

**Success Response (200):**
```json
{
  "id": "OP-1",
  "start": "2025-08-20T10:00:00Z",
  "end": "2025-08-20T11:00:00Z"
}
```

**Error Response (400):**
```json
{
  "code": "RULE_VIOLATION",
  "message": "Operation must start after previous (idx 0 ends)",
  "details": {
    "message": "Operation must start after previous (idx 0 ends)",
    "prevEnd": "2025-08-20T09:30:00.000000+00:00"
  }
}
```

##  Business Rules

The API enforces three key scheduling rules:

### R1 - Precedence
Operations within a work order must maintain sequence order. Operation `k` cannot start before operation `k-1` ends.

### R2 - Lane Exclusivity  
No two operations can overlap on the same machine/lane.

### R3 - No Past Scheduling
Operations cannot be scheduled to start before the current time.

##  Database Schema

### WorkOrder Table
- `id` (String, Primary Key)
- `product` (String, Not Null)
- `qty` (Integer, Not Null)

### Operation Table
- `id` (String, Primary Key)
- `work_order_id` (String, Foreign Key, Not Null)
- `idx` (Integer, Not Null) - Sequence order within work order
- `machine_id` (String, Not Null) - Machine/lane identifier
- `name` (String, Not Null)
- `start_utc` (DateTime with timezone, Not Null)
- `end_utc` (DateTime with timezone, Not Null)

**Constraints:**
- Unique constraint on `(work_order_id, idx)` ensures proper sequencing

## Development Commands

```bash

flask db migrate -m "migration description"

flask db upgrade


flask seed


flask run --debug
```

##  Dependencies

Key packages and their purposes:

- `Flask==3.1.2` - Web framework
- `Flask-SQLAlchemy==3.1.1` - ORM integration
- `Flask-Migrate==4.1.0` - Database migrations
- `Flask-CORS==6.0.1` - Cross-origin resource sharing
- `psycopg2-binary==2.9.10` - PostgreSQL adapter
- `python-dotenv==1.1.1` - Environment variable loading

##  Testing

The application includes comprehensive validation testing through the business rules engine. Test your API endpoints using tools like:

- Postman
- curl
- Python requests
- Frontend integration tests

