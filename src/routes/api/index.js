// src/routes/api/index.js - SIMPLEST approach
const express = require('express');
const router = express.Router();

// Simple raw body parser that accepts all content types for now
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: () => true  // Accept everything, let the POST handler validate
  });

router.get('/fragments', require('./get'));
router.post('/fragments', rawBody(), require('./post'));
router.get('/fragments/:id', require('./getIdExt'));
router.get('/fragments/:id/info', require('./getInfo'));



module.exports = router;
