import { Router } from 'express';
import { submitInquiry } from '../controllers/contact.controller.js';

const router = Router();

router.post('/', submitInquiry);

export default router;
