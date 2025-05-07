const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/EventsDB', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

const EventSchema = mongoose.Schema({
    name: { type: String, unique: true },
    description: String,
    date: Date,
    location: String,
    capacity: { type: Number, required: true },
    userId: {  // Add this field
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }
  }, { versionKey: false });

module.exports = mongoose.model('Event', EventSchema);