const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Reference based on type
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student',
    required: function() { return this.type === 'student'; }
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher',
    required: function() { return this.type === 'teacher'; }
  },
  
  // Type of attendance
  type: { 
    type: String, 
    required: true, 
    enum: ['student', 'teacher'] 
  },
  
  // Class (only for students)
  className: { 
    type: String, 
    trim: true 
  },
  
  // Attendance date
  date: { 
    type: Date, 
    required: true 
  },
  
  // Attendance status
  status: { 
    type: String, 
    required: true, 
    enum: ['Present', 'Absent', 'Late', 'Leave'] 
  },
  
  // Optional remarks
  remarks: { 
    type: String, 
    trim: true,
    maxlength: 200
  },
  
  // Who marked this attendance
  markedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

// Compound index for fast queries (unique per person per day per type)
attendanceSchema.index({ student: 1, date: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'student' } });
attendanceSchema.index({ teacher: 1, date: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'teacher' } });

// Index for date-based queries
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ className: 1, date: -1 });
attendanceSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);