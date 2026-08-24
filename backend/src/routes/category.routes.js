import { Router } from 'express';
import { getCategories, getCategoryBySlug } from '../controllers/category.controller.js';
import { getCollections, getCollectionBySlug } from '../controllers/category.controller.js';

const categoryRouter = Router();
categoryRouter.get('/', getCategories);
categoryRouter.get('/:slug', getCategoryBySlug);

const collectionRouter = Router();
collectionRouter.get('/', getCollections);
collectionRouter.get('/:slug', getCollectionBySlug);

export { categoryRouter, collectionRouter };
