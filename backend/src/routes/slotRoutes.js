const router = require('express').Router();
const c = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');
const { validateSlot, validateObjectId } = require('../middleware/validate');

router.use(protect);

router.get('/', c.list);
router.get('/:id', validateObjectId(), c.getOne);

// admin only
router.post('/', authorize('admin'), validateSlot(false), c.create);
router.put('/:id', authorize('admin'), validateObjectId(), validateSlot(true), c.update);
router.delete('/:id', authorize('admin'), validateObjectId(), c.remove);

module.exports = router;
