const router = require('express').Router();
const searchController = require('../controllers/search.controller');
const { validateSearch } = require('../middleware/validate');

router.get('/', validateSearch, searchController.search);

module.exports = router;
