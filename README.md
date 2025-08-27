
<img src="client/public/safakpng.png" alt="safak Logo" width="50%"/>

# Safak-Teknik-Tekstil-Challenge

**Author:** Yakup Celepi

This project is a comprehensive factory production scheduling system that visualizes work orders on an interactive Gantt-style timeline. Users can view, manage, and reschedule manufacturing operations with drag-and-drop functionality while maintaining scheduling constraints and business rules. The application is developed with modern technologies and focuses on user experience and operational efficiency.

---

##  Overview

The Factory Production Schedule is a full-stack web application designed to streamline manufacturing operations management. It provides an intuitive visual interface for production planners to:

- **Visualize Production Timeline**: Interactive Gantt chart showing all work orders and operations
- **Manage Work Orders**: Complete lifecycle management of manufacturing orders
- **Schedule Operations**: Drag-and-drop rescheduling with real-time validation
- **Monitor Machine Utilization**: Track machine efficiency and operation distribution
- **Enforce Business Rules**: Automatic validation of scheduling constraints
- **Real-time Updates**: Immediate feedback and conflict detection

##  Architecture

This is a **full-stack application** consisting of two main components:

```
factory-schedule/
├── server/          
├── client/          
└── README.md        
```

### Backend (Server)
- **Technology**: Python Flask REST API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Features**: Work order management, operation scheduling, business rule validation
- **API**: RESTful endpoints with comprehensive error handling

### Frontend (Client)
- **Technology**: React 19 with TypeScript and Vite
- **UI/UX**: Modern dark theme with responsive design
- **Features**: Interactive Gantt timeline, drag-and-drop, real-time notifications
- **State Management**: Zustand for optimized performance

##  Key Features

###  Visual Timeline
- **Machine-based Lanes**: Each production machine gets its own timeline lane
- **Interactive Operations**: Click to highlight, drag to reschedule
- **Adaptive Time Scale**: Automatic time tick generation based on zoom level
- **Current Time Indicator**: Real-time "now" line for current scheduling context

###  Smart Scheduling
- **Precedence Rules**: Operations must maintain sequence within work orders
- **Conflict Detection**: Automatic detection and highlighting of scheduling conflicts
- **Machine Exclusivity**: Prevents double-booking of manufacturing equipment
- **Time Constraints**: Prevents scheduling operations in the past

###  Work Order Management
- **Complete Visibility**: Full work order details with operation breakdowns
- **Search & Filter**: Quick access to specific orders or operations
- **Status Tracking**: Real-time status updates and progress monitoring
- **Batch Operations**: Efficient management of multiple work orders

###  Real-time Operations
- **Live Updates**: Changes are immediately reflected across all views
- **Optimistic UI**: Instant feedback with rollback on validation errors
- **Toast Notifications**: Clear success/error messaging
- **Auto-refresh**: Periodic data synchronization

##  Quick Start

### Prerequisites
- **Backend**: Python 3.8+, PostgreSQL 12+
- **Frontend**: Node.js 18+, npm 8+

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd factory-schedule
   ```

2. **Setup Backend**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate 
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your database settings
   
   # Setup database
   flask db upgrade
   flask seed
   
   # Start server
   python manage.py
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with API URL (default: http://localhost:5000/api)
   
   # Start development server
   npm run dev
   ```

4. **Access Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## Business Rules

The system enforces critical manufacturing constraints:

1. **R1 - Precedence**: Operations within a work order must maintain their sequence order
2. **R2 - Lane Exclusivity**: No machine can handle multiple operations simultaneously  
3. **R3 - No Past Scheduling**: Operations cannot be scheduled before the current time
4. **R4 - Cross-lane Changes**: Operations can be moved between compatible machines

##  Technology Stack

### Backend Technologies
- **Flask 3.1.2** - Web framework
- **SQLAlchemy 2.0.43** - ORM and database toolkit
- **PostgreSQL** - Primary database
- **Flask-Migrate** - Database migration management
- **Flask-CORS** - Cross-origin resource sharing

### Frontend Technologies
- **React 19.1.1** - UI framework
- **TypeScript 5.9.2** - Type safety and developer experience
- **Vite 5.4.19** - Build tool and development server
- **Zustand 5.0.8** - State management
- **SCSS** - Advanced styling with design system
- **@dnd-kit** - Drag and drop functionality

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Flask-Migrate** - Database schema management

##  Data Model

### Work Order
- **ID**: Unique identifier (e.g., "WO-1001")
- **Product**: Product name being manufactured
- **Quantity**: Number of units to produce
- **Operations**: List of required manufacturing steps

### Operation
- **ID**: Unique identifier (e.g., "OP-1")
- **Work Order ID**: Parent work order reference
- **Index**: Sequence position within work order
- **Machine ID**: Assigned production machine
- **Name**: Operation description (e.g., "Cut", "Assemble")
- **Start/End Times**: Scheduled time window (ISO-8601 UTC)

##  User Interface

### Design Principles
- **Dark Theme**: Reduces eye strain during long planning sessions
- **Information Density**: Maximum relevant information without clutter
- **Interactive Feedback**: Immediate visual response to user actions
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile

### Key UI Components
- **Gantt Timeline**: Main scheduling interface with machine lanes
- **Sidebar Panel**: Work order management and search functionality
- **Control Header**: View mode selection and filtering options
- **Toast System**: Non-intrusive notification system

##  Performance Features

- **Optimistic Updates**: UI updates immediately, rollback on server errors
- **Memoized Calculations**: Timeline computations cached for performance
- **Efficient Rendering**: Minimal React re-renders through optimization
- **Responsive Data Loading**: Progressive loading for large datasets

##  Development

### Project Structure
Each component (server/client) has its own detailed README with:
- Detailed installation instructions
- API documentation
- Component architecture
- Development workflows
- Deployment guidelines


### Scaling Options
- **Horizontal**: Load balancers, multiple app instances
- **Database**: Read replicas, connection pooling
- **Caching**: Redis for session management and API caching
- **CDN**: Static asset delivery optimization

---
