import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createAddressValidator, updateAddressValidator } from '../validators/address.validator.js';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../controllers/address.controller.js';

const router = Router();

router.use(protect);

router.get('/', getAddresses);
router.post('/', validate(createAddressValidator), createAddress);
router.put('/:id', validate(updateAddressValidator), updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

export default router;
