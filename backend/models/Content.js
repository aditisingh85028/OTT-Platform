const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 0 }, // in minutes
});

const seasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true },
  episodes: [episodeSchema],
});

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true, // uploaded to Cloudinary
    },
    videoUrl: {
      type: String,
      // required if movie, series will have episode video URLs
      default: '',
    },
    type: {
      type: String,
      enum: ['movie', 'series'],
      required: true,
    },
    genres: [
      {
        type: String,
        required: true,
      },
    ],
    duration: {
      type: Number, // in minutes, for movies
      default: 0,
    },
    releaseYear: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    cast: [
      {
        type: String,
      },
    ],
    seasons: [seasonSchema], // only for series
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Content', contentSchema);
