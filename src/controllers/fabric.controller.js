import Fabric from '../models/Fabric.js';

// Public: get all fabrics (for catalog)
export const getAllFabrics = async (req, res, next) => {
  try {
    const fabrics = await Fabric.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: fabrics });
  } catch (err) {
    next(err);
  }
};

// Admin: get all fabrics (including inactive)
export const getAdminFabrics = async (req, res, next) => {
  try {
    const fabrics = await Fabric.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: fabrics });
  } catch (err) {
    next(err);
  }
};

export const createFabric = async (req, res, next) => {
  try {
    const { name, isActive = true, sortOrder = 0 } = req.body;
    const existing = await Fabric.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fabric already exists' });
    }
    const fabric = await Fabric.create({ name: name.trim(), isActive, sortOrder });
    res.status(201).json({ success: true, data: fabric });
  } catch (err) {
    next(err);
  }
};

export const updateFabric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fabric = await Fabric.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!fabric) return res.status(404).json({ success: false, message: 'Fabric not found' });
    res.json({ success: true, data: fabric });
  } catch (err) {
    next(err);
  }
};

export const deleteFabric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fabric = await Fabric.findByIdAndDelete(id);
    if (!fabric) return res.status(404).json({ success: false, message: 'Fabric not found' });
    res.json({ success: true, data: fabric });
  } catch (err) {
    next(err);
  }
};
