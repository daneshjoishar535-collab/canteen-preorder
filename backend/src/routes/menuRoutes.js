const router = require('express').Router();
const c = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { validateMenuItem, validateObjectId } = require('../middleware/validate');

router.use(protect);

router.get('/', c.list);
router.get('/:id', validateObjectId(), c.getOne);

// admin only
router.post('/', authorize('admin'), validateMenuItem(false), c.create);
router.put('/:id', authorize('admin'), validateObjectId(), validateMenuItem(true), c.update);
router.delete('/:id', authorize('admin'), validateObjectId(), c.remove);

module.exports = router;
