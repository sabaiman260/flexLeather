import Router from 'express'
import { upload } from '../../core/middleware/multer.js'
import { isLoggedIn } from '../../core/middleware/isLoggedIn.js'
import { isAdmin } from '../../core/middleware/isAdmin.js'
import {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from './banner.controller.js'

const bannerRouter = Router()

// Public
bannerRouter.get('/', getActiveBanners)

// Admin
bannerRouter.get('/getAllAdmin', isLoggedIn, isAdmin, getAllBannersAdmin)
bannerRouter.post('/create', isLoggedIn, isAdmin, upload.single('image'), createBanner)
bannerRouter.put('/update/:id', isLoggedIn, isAdmin, upload.single('image'), updateBanner)
bannerRouter.delete('/delete/:id', isLoggedIn, isAdmin, deleteBanner)
bannerRouter.put('/reorder', isLoggedIn, isAdmin, reorderBanners)

export default bannerRouter
