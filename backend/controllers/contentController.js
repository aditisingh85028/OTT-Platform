const Content = require('../models/Content');

// @desc    Get all contents (with Search & Filters)
// @route   GET /api/content
// @access  Public/Private
const getContents = async (req, res) => {
  try {
    const { search, type, genre, featured } = req.query;
    let query = {};

    // Filter by type (movie / series)
    if (type) {
      query.type = type;
    }

    // Filter by featured
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Filter by genre
    if (genre) {
      query.genres = { $in: [genre] };
    }

    // Search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const contents = await Content.find(query).sort({ createdAt: -1 });
    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured contents
// @route   GET /api/content/featured
// @access  Public/Private
const getFeaturedContents = async (req, res) => {
  try {
    const featured = await Content.find({ isFeatured: true }).limit(5);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single content by ID & increment view
// @route   GET /api/content/:id
// @access  Public/Private
const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.id || req.params.id);

    if (content) {
      content.views += 1;
      await content.save();
      res.json(content);
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create content
// @route   POST /api/content
// @access  Private/Admin
const createContent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      genres,
      duration,
      releaseYear,
      cast,
      videoUrl,
      isFeatured,
      seasons,
    } = req.body;

    let thumbnailUrl = '';
    if (req.file) {
      thumbnailUrl = req.file.path; // Cloudinary URL
    } else if (req.body.thumbnailUrl) {
      thumbnailUrl = req.body.thumbnailUrl;
    } else {
      return res.status(400).json({ message: 'Please upload a thumbnail image' });
    }

    // Convert genres and cast to arrays if sent as strings
    const genresArray = Array.isArray(genres)
      ? genres
      : genres.split(',').map((g) => g.trim());
    const castArray = Array.isArray(cast)
      ? cast
      : cast ? cast.split(',').map((c) => c.trim()) : [];

    // Parse seasons if it is sent as string (like in multiform-data)
    let parsedSeasons = [];
    if (type === 'series' && seasons) {
      parsedSeasons = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
    }

    const content = new Content({
      title,
      description,
      thumbnailUrl,
      videoUrl: type === 'movie' ? videoUrl : '',
      type,
      genres: genresArray,
      duration: type === 'movie' ? Number(duration) : 0,
      releaseYear: Number(releaseYear),
      cast: castArray,
      seasons: type === 'series' ? parsedSeasons : [],
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    const createdContent = await content.save();
    res.status(201).json(createdContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Admin
const updateContent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      genres,
      duration,
      releaseYear,
      cast,
      videoUrl,
      isFeatured,
      seasons,
    } = req.body;

    const content = await Content.findById(req.params.id);

    if (content) {
      content.title = title || content.title;
      content.description = description || content.description;
      content.type = type || content.type;
      content.releaseYear = releaseYear ? Number(releaseYear) : content.releaseYear;
      content.isFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : content.isFeatured;

      if (req.file) {
        content.thumbnailUrl = req.file.path; // New Cloudinary URL
      } else if (req.body.thumbnailUrl) {
        content.thumbnailUrl = req.body.thumbnailUrl;
      }

      if (content.type === 'movie') {
        content.videoUrl = videoUrl || content.videoUrl;
        content.duration = duration ? Number(duration) : content.duration;
        content.seasons = [];
      } else {
        content.videoUrl = '';
        content.duration = 0;
        if (seasons) {
          content.seasons = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
        }
      }

      if (genres) {
        content.genres = Array.isArray(genres)
          ? genres
          : genres.split(',').map((g) => g.trim());
      }

      if (cast) {
        content.cast = Array.isArray(cast)
          ? cast
          : cast.split(',').map((c) => c.trim());
      }

      const updatedContent = await content.save();
      res.json(updatedContent);
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Admin
const deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (content) {
      await Content.deleteOne({ _id: content._id });
      res.json({ message: 'Content removed successfully' });
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContents,
  getFeaturedContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
};
