# TAFE Timetable App

An interactive timetabling solution designed specifically for TAFE NSW, providing comprehensive scheduling management for educational institutions.

## 🎯 Overview

This web-based application offers a complete timetabling solution that enables educational administrators to efficiently manage schedules, courses, teachers, and rooms across multiple campuses. Built with modern web technologies, it provides an intuitive drag-and-drop interface for easy schedule creation and management.

## ✨ Key Features

### 📅 Timetable Management
- **Interactive Scheduling**: Drag-and-drop interface for easy timetable creation
- **Multi-campus Support**: Manage schedules across multiple TAFE locations
- **Real-time Updates**: Instant schedule modifications and conflict detection
- **Export Options**: Generate printable timetables and reports

### 👨‍🏫 Staff Management
- **Teacher Profiles**: Comprehensive teacher information and availability
- **Workload Tracking**: Monitor teaching hours and assignments
- **Specialization Management**: Track teacher qualifications and subject expertise

### 📚 Course & Unit Management
- **Course Catalog**: Complete course and unit information management
- **Prerequisites Tracking**: Manage course requirements and dependencies
- **Resource Allocation**: Assign rooms, equipment, and materials

### 🏢 Room & Resource Management
- **Room Booking**: Efficient allocation of classrooms and labs
- **Equipment Tracking**: Manage specialized equipment and resources
- **Capacity Management**: Optimize room utilization

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB for data persistence
- **Authentication**: JWT-based secure authentication
- **UI Framework**: Bootstrap for responsive design
- **Drag & Drop**: Native HTML5 drag-and-drop API

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14.0 or higher)
- MongoDB (v4.0 or higher)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mbelik07/tafe-timetable-app.git
   cd tafe-timetable-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📖 Usage Guide

### Creating a New Timetable
1. Log in to the admin dashboard
2. Select "Create New Timetable" from the main menu
3. Choose the academic period and campus
4. Add courses, teachers, and rooms
5. Use drag-and-drop to assign time slots
6. Review and publish the timetable

### Managing Teachers
1. Navigate to the "Teachers" section
2. Add new teacher profiles with qualifications
3. Set availability and preferred teaching hours
4. Assign teachers to specific courses
5. Monitor workload and teaching assignments

### Room Allocation
1. Access the "Rooms" management panel
2. Add room details including capacity and equipment
3. Set room availability and booking rules
4. Assign rooms to courses based on requirements
5. View room utilization reports

## 🎨 User Interface

### Admin Dashboard
- Comprehensive overview of all timetables
- Quick access to all management functions
- Real-time notifications and alerts
- Customizable widgets and layouts

### Teacher Portal
- Personal timetable view
- Availability management
- Course material access
- Communication tools

### Student View
- Class schedule display
- Course information access
- Room location and directions
- Mobile-responsive design

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tafe-timetable
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Database Schema
The application uses MongoDB with collections for:
- Users (administrators, teachers, students)
- Courses and units
- Timetables and schedules
- Rooms and resources
- System configurations

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📊 Performance & Scalability

- Optimized for handling large datasets
- Efficient database queries with indexing
- Caching mechanisms for improved performance
- Scalable architecture for multiple users

## 🔒 Security Features

- Secure authentication and authorization
- Input validation and sanitization
- HTTPS support for production deployment
- Regular security updates and patches

## 📱 Mobile Compatibility

- Responsive design for all screen sizes
- Touch-friendly interface for tablets
- Mobile-optimized navigation
- Offline capability for basic functions

## 🤝 Contributing

We welcome contributions to improve the TAFE Timetable App! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write comprehensive tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues section to report bugs or request new features. Include:
- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- TAFE NSW for the opportunity to develop this solution
- Educational technology community for inspiration
- Open source contributors and libraries

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation wiki
- Review existing issues for solutions

---

**Made with ❤️ for TAFE NSW**  
*Simplifying educational scheduling, one timetable at a time.*