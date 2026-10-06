const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validateOrder, validateObjectId } = require('../middleware/validate');

router.use(protect);

router.post('/', authorize('student', 'admin'), validateOrder, c.create);
router.get('/', c.list);
router.get('/:id', validateObjectId(), c.getOne);
router.patch('/:id/cancel', validateObjectId(), c.cancel);

// admin only: move order through confirmed -> preparing -> ready -> completed
router.patch('/:id/status', authorize('admin'), validateObjectId(), c.updateStatus);

module.exports = router;
