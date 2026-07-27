import { asyncHandler } from '../../core/utils/async-handler.js'
import Banner from '../../models/Banner.model.js'
import { ApiError } from '../../core/utils/api-error.js'
import { ApiResponse } from '../../core/utils/api-response.js'
import S3UploadHelper from '../../shared/helpers/s3Upload.js'

// Public: get active banners ordered by `order`
const getActiveBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ order: 1 })

  const withUrls = await Promise.all(
    banners.map(async (b) => {
      let imageUrl = ''
      try {
        imageUrl = await S3UploadHelper.getSignedUrl(b.imageKey)
      } catch (e) {
        console.error('Failed to get signed url for banner', b._id, e?.message || e)
        imageUrl = ''
      }
      return { ...b._doc, imageUrl }
    })
  )

  return res.status(200).json(new ApiResponse(200, withUrls, 'Active banners fetched'))
})

// Admin: get all banners (including inactive)
const getAllBannersAdmin = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({}).sort({ order: 1 })

  const withUrls = await Promise.all(
    banners.map(async (b) => {
      let imageUrl = ''
      try {
        imageUrl = await S3UploadHelper.getSignedUrl(b.imageKey)
      } catch (e) {
        imageUrl = ''
      }
      return { ...b._doc, imageUrl }
    })
  )

  return res.status(200).json(new ApiResponse(200, withUrls, 'All banners fetched'))
})

// Admin: create banner (multipart)
const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, ctaText, ctaUrl, category, order, isActive, imageAlt } = req.body

  if (!req.file) throw new ApiError(400, 'Banner image is required')

  let uploadRes
  try {
    uploadRes = await S3UploadHelper.uploadFile(req.file, 'banners')
  } catch (e) {
    console.error('Banner upload failed', e?.message || e)
    throw new ApiError(500, 'Failed to upload banner image')
  }

  const banner = await Banner.create({
    title,
    subtitle,
    ctaText,
    ctaUrl,
    category,
    order: order !== undefined ? Number(order) : 0,
    isActive: typeof isActive === 'string' ? isActive === 'true' : !!isActive,
    imageKey: uploadRes.key,
    imageAlt: imageAlt || '',
  })

  let imageUrl = ''
  try {
    imageUrl = await S3UploadHelper.getSignedUrl(banner.imageKey)
  } catch (e) {}

  return res.status(201).json(new ApiResponse(201, { banner, imageUrl }, 'Banner created'))
})

// Admin: update banner metadata and optionally replace image
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id)
  if (!banner) throw new ApiError(404, 'Banner not found')

  const { title, subtitle, ctaText, ctaUrl, category, order, isActive, imageAlt } = req.body

  if (title !== undefined) banner.title = title
  if (subtitle !== undefined) banner.subtitle = subtitle
  if (ctaText !== undefined) banner.ctaText = ctaText
  if (ctaUrl !== undefined) banner.ctaUrl = ctaUrl
  if (category !== undefined) banner.category = category
  if (order !== undefined) banner.order = Number(order)
  if (isActive !== undefined) banner.isActive = typeof isActive === 'string' ? isActive === 'true' : !!isActive
  if (imageAlt !== undefined) banner.imageAlt = imageAlt

  // If new file provided, upload and delete old
  if (req.file) {
    try {
      const uploadRes = await S3UploadHelper.uploadFile(req.file, 'banners')
      // delete old
      try {
        if (banner.imageKey) await S3UploadHelper.deleteFile(banner.imageKey)
      } catch (e) {
        console.warn('Failed to delete old banner image', e?.message || e)
      }
      banner.imageKey = uploadRes.key
    } catch (e) {
      console.error('Banner image replacement failed', e?.message || e)
    }
  }

  await banner.save()

  let imageUrl = ''
  try {
    imageUrl = await S3UploadHelper.getSignedUrl(banner.imageKey)
  } catch (e) {}

  return res.status(200).json(new ApiResponse(200, { banner, imageUrl }, 'Banner updated'))
})

// Admin: delete banner
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id)
  if (!banner) throw new ApiError(404, 'Banner not found')

  try {
    if (banner.imageKey) await S3UploadHelper.deleteFile(banner.imageKey)
  } catch (e) {
    console.warn('Failed to delete banner image from cloudinary', e?.message || e)
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Banner deleted'))
})

// Admin: reorder banners (accepts [{ id, order }])
const reorderBanners = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body.items || []
  if (!Array.isArray(items)) throw new ApiError(400, 'Invalid payload')

  const ops = items.map((it) => {
    return Banner.findByIdAndUpdate(it.id, { order: Number(it.order || 0) })
  })

  await Promise.all(ops)

  return res.status(200).json(new ApiResponse(200, {}, 'Banners reordered'))
})

export {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
}
