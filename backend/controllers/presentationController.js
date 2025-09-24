// backend/controllers/presentationController.js
const db = require('../models');
const PresentationContent = db.PresentationContent;
const fs = require('fs');
const path = require('path');

// Constants for the single presentation ID/sectionName
const MAIN_PRESENTATION_SECTION_NAME = 'main_presentation';
const UPLOAD_DIR_NAME = 'uploads/presentation_images'; // Consistent directory name

// Helper to get the full image URL path for frontend display
const getImageFullPath = (imageLocalPathInDb) => {
  console.log(`[getImageFullPath] Input (from DB): "${imageLocalPathInDb}"`);
  if (!imageLocalPathInDb) {
      console.log('[getImageFullPath] Input is null/empty, returning null.');
      return null;
  }

  let cleanPath = imageLocalPathInDb.replace(/\\/g, '/');
  console.log(`[getImageFullPath] After replacing backslashes: "${cleanPath}"`);

  while (cleanPath.startsWith('/') || cleanPath.startsWith('//') || cleanPath.startsWith('app/')) {
    if (cleanPath.startsWith('//')) {
        cleanPath = cleanPath.substring(2);
    } else if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    } else if (cleanPath.startsWith('app/')) {
        cleanPath = cleanPath.substring(4);
    }
    console.log(`[getImageFullPath] After stripping prefix: "${cleanPath}"`);
  }

  if (!cleanPath.startsWith('uploads/')) {
      console.warn(`[getImageFullPath] Path "${cleanPath}" did not start with "uploads/", prepending it.`);
      cleanPath = `${UPLOAD_DIR_NAME}/${cleanPath.split('/').pop()}`;
  }

  const finalWebPath = `/${cleanPath}`;
  console.log(`[getImageFullPath] Final output URL for frontend: "${finalWebPath}"`);
  return finalWebPath;
};


// @desc    Get the single main presentation content
// @route   GET /api/presentation/main
// @access  Public
exports.getMainPresentation = async (req, res) => {
  console.log('\n--- Backend (PresentationController - getMainPresentation): Request Received ---');
  try {
    let presentation = await db.PresentationContent.findOne({
      where: { sectionName: MAIN_PRESENTATION_SECTION_NAME }
    });

    if (!presentation) {
      console.log('[getMainPresentation] No presentation found, creating a default one.');
      presentation = await db.PresentationContent.create({
        sectionName: MAIN_PRESENTATION_SECTION_NAME,
        contentBlocks: [],
        directorName: null,
        directorPosition: null,
        directorImage: null,
        counter1Value: 0,
        counter1Label: 'Permanents',
        counter2Value: 0,
        counter2Label: 'Articles impactés',
        counter3Value: 0,
        counter3Label: 'Articles publiés',
      });
      return res.status(200).json({ success: true, data: presentation.toJSON() });
    }

    console.log('[getMainPresentation] Found existing presentation.');
    console.log('[getMainPresentation] Raw contentBlocks from DB (BEFORE model getter processing):', presentation.getDataValue('contentBlocks'));
    
    const contentBlocksFromModel = presentation.contentBlocks;
    console.log('[getMainPresentation] ContentBlocks after model getter (parsed array):', JSON.stringify(contentBlocksFromModel, null, 2));


    const formattedBlocks = (Array.isArray(contentBlocksFromModel) ? contentBlocksFromModel : []).map((block, index) => {
      if (block.type === 'image' && block.url) {
        console.log(`[getMainPresentation] Processing image block ${index}. Raw URL (from model getter): "${block.url}"`);
        if (!block.url.startsWith('http://') && !block.url.startsWith('https://')) {
          const formattedUrl = getImageFullPath(block.url);
          console.log(`[getMainPresentation] Formatted URL for block ${index} (via getImageFullPath): "${formattedUrl}"`);
          // Include all image properties for frontend display
          return {
            ...block,
            url: formattedUrl,
            originalWidth: block.originalWidth || null,
            originalHeight: block.originalHeight || null,
            width: block.width || null,
            height: block.height || null,
            sizeSliderValue: block.sizeSliderValue || 0,
          };
        } else {
            console.log(`[getMainPresentation] Block ${index} URL is external, keeping as is: "${block.url}"`);
        }
      }
      return block;
    });

    let formattedDirectorImage = null;
    if (presentation.directorImage && !presentation.directorImage.startsWith('http://') && !presentation.directorImage.startsWith('https://')) {
        formattedDirectorImage = getImageFullPath(presentation.directorImage);
        console.log(`[getMainPresentation] Formatted Director Image URL: "${formattedDirectorImage}"`);
    } else {
        formattedDirectorImage = presentation.directorImage;
    }

    const responseData = {
      ...presentation.toJSON(),
      contentBlocks: formattedBlocks,
      directorImage: formattedDirectorImage,
    };
    console.log('[getMainPresentation] Final Response data being sent to frontend:', JSON.stringify(responseData, null, 2));
    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching main presentation content:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  } finally {
      console.log('--- END Backend (PresentationController - getMainPresentation) ---');
  }
};


// @desc    Update the main presentation content
// @route   PUT /api/presentation/main
// @access  Private (Admin only)
exports.updateMainPresentation = async (req, res, next) => {
  console.log('\n--- Backend (PresentationController - updateMainPresentation): Request Received ---');
  console.log('req.body (raw):', req.body);
  console.log('req.files (from Multer):', req.files);

  try {
    let presentation = await db.PresentationContent.findOne({
      where: { sectionName: MAIN_PRESENTATION_SECTION_NAME }
    });

    if (!presentation) {
      console.error('[updateMainPresentation] Main presentation content not found, this should not happen.');
      return res.status(404).json({ success: false, message: 'Main presentation content not found.' });
    }

    const incomingContentBlocks = req.body.contentBlocks ? JSON.parse(req.body.contentBlocks) : [];
    console.log('[updateMainPresentation] Parsed incomingContentBlocks (from frontend):', JSON.stringify(incomingContentBlocks, null, 2));
    
    const newContentBlocks = []; 
    
    for (let i = 0; i < incomingContentBlocks.length; i++) {
      const block = incomingContentBlocks[i];
      let newBlock = { ...block }; // Start with all properties from the incoming block

      if (block.type === 'image') {
        const imageFileKey = `image_${i}`;
        const uploadedFile = req.files && req.files[imageFileKey] ? req.files[imageFileKey][0] : null;

        if (uploadedFile) {
          let pathForDb = uploadedFile.path.replace(/\\/g, '/');
          while (pathForDb.startsWith('/') || pathForDb.startsWith('app/')) {
            if (pathForDb.startsWith('/app/')) {
                pathForDb = pathForDb.substring(4);
            } else if (pathForDb.startsWith('/')) {
                pathForDb = pathForDb.substring(1);
            }
          }
          newBlock.url = pathForDb;
          // *****************************************************************
          // FIX: Ensure all image properties are explicitly assigned,
          // even if a new file is uploaded. Use || null/0 for safety.
          newBlock.originalWidth = block.originalWidth || null;
          newBlock.originalHeight = block.originalHeight || null;
          newBlock.width = block.width || null;
          newBlock.height = block.height || null;
          newBlock.sizeSliderValue = block.sizeSliderValue || 0;
          // *****************************************************************

          const oldContentBlocks = Array.isArray(presentation.contentBlocks) ? presentation.contentBlocks : [];
          const oldBlock = oldContentBlocks.find(old => old.id === block.id);
          if (oldBlock && oldBlock.type === 'image' && oldBlock.url && !oldBlock.url.startsWith('http')) {
            const oldImagePathToDelete = path.join(__dirname, '..', oldBlock.url);
            if (fs.existsSync(oldImagePathToDelete)) {
              fs.unlink(oldImagePathToDelete, (err) => {
                if (err) console.error(`Error deleting old image for block ${i}:`, err);
              });
            }
          }

        } else if (block.url === null || block.url === undefined || block.url === '' || block.url.startsWith('blob:')) {
          const oldContentBlocks = Array.isArray(presentation.contentBlocks) ? presentation.contentBlocks : [];
          const originalBlock = oldContentBlocks.find(pBlock => pBlock.id === block.id);
          if (originalBlock && originalBlock.type === 'image' && originalBlock.url && !originalBlock.url.startsWith('http')) {
             const oldImagePathToDelete = path.join(__dirname, '..', originalBlock.url);
             if (fs.existsSync(oldImagePathToDelete)) {
               fs.unlink(oldImagePathToDelete, (err) => {
                 if (err) console.error(`Error deleting old image on explicit clear: ${oldImagePathToDelete}`, err);
               });
             }
          }
          newBlock.url = null;
          newBlock.originalWidth = null;
          newBlock.originalHeight = null;
          newBlock.width = null;
          newBlock.height = null;
          newBlock.sizeSliderValue = 50; // Reset slider to default when image is cleared

        } else { // Existing image without new upload: ensure properties are maintained
            // *****************************************************************
            // FIX: Explicitly assign all image properties from the incoming block.
            // This is crucial when no new file is uploaded but other properties might have changed.
            newBlock.url = block.url; 
            newBlock.altText = block.altText || '';
            newBlock.caption = block.caption || '';
            newBlock.originalWidth = block.originalWidth || null;
            newBlock.originalHeight = block.originalHeight || null;
            newBlock.width = block.width || null;
            newBlock.height = block.height || null;
            newBlock.sizeSliderValue = block.sizeSliderValue || 0;
            // *****************************************************************
        }
      }
      newContentBlocks.push(newBlock);
    }

    const oldImagePathsInDb = (Array.isArray(presentation.contentBlocks) ? presentation.contentBlocks : [])
      .filter(block => block.type === 'image' && block.url && !block.url.startsWith('http'))
      .map(block => block.url);

    const currentLocalPathsBeingSaved = newContentBlocks
      .filter(block => block.type === 'image' && block.url && !block.url.startsWith('http'))
      .map(block => block.url);
    const pathsToKeepSet = new Set(currentLocalPathsBeingSaved);


    for (const oldPath of oldImagePathsInDb) {
      if (!pathsToKeepSet.has(oldPath)) {
        const fullPathToDelete = path.join(__dirname, '..', oldPath);
        if (fs.existsSync(fullPathToDelete)) {
          fs.unlink(fullPathToDelete, (err) => {
            if (err) console.error(`Error deleting unreferenced old image: ${fullPathToDelete}`, err);
          });
        }
      }
    }

    const fieldsToUpdate = {
      directorName: req.body.directorName || null,
      directorPosition: req.body.directorPosition || null,
      counter1Value: req.body.counter1Value ? parseInt(req.body.counter1Value, 10) : 0,
      counter1Label: req.body.counter1Label || 'Permanents',
      counter2Value: req.body.counter2Value ? parseInt(req.body.counter2Value, 10) : 0,
      counter2Label: req.body.counter2Label || 'Articles impactés',
      counter3Value: req.body.counter3Value ? parseInt(req.body.counter3Value, 10) : 0,
      counter3Label: req.body.counter3Label || 'Articles publiés',
      contentBlocks: newContentBlocks, // This is the processed ARRAY
    };

    const directorImageFile = req.files && req.files['directorImage'] ? req.files['directorImage'][0] : null;
    if (directorImageFile) {
        if (presentation.directorImage && !presentation.directorImage.startsWith('http')) {
            const oldDirectorImagePath = path.join(__dirname, '..', presentation.directorImage);
            if (fs.existsSync(oldDirectorImagePath)) {
                fs.unlink(oldDirectorImagePath, (err) => {
                    if (err) console.error(`Error deleting old director image: ${oldDirectorImagePath}`, err);
                });
            }
        }
        let pathForDb = directorImageFile.path.replace(/\\/g, '/');
        if (pathForDb.startsWith('/app/')) {
            pathForDb = pathForDb.slice(4);
        } else if (pathForDb.startsWith('/')) {
            pathForDb = pathForDb.slice(1);
        }
        fieldsToUpdate.directorImage = pathForDb;
    } else if (req.body.directorImage === 'null' || req.body.directorImage === '') {
        if (presentation.directorImage && !presentation.directorImage.startsWith('http')) {
            const oldDirectorImagePath = path.join(__dirname, '..', presentation.directorImage);
            if (fs.existsSync(oldDirectorImagePath)) {
                fs.unlink(oldDirectorImagePath, (err) => {
                    if (err) console.error(`Error deleting director image on clear: ${oldDirectorImagePath}`, err);
                });
            }
        }
        fieldsToUpdate.directorImage = null;
    } else if (req.body.directorImage && !req.body.directorImage.startsWith('http')) {
        let pathForDb = req.body.directorImage.replace(/\\/g, '/');
        if (pathForDb.startsWith('/')) {
            pathForDb = pathForDb.slice(1);
        }
        fieldsToUpdate.directorImage = pathForDb;
    } else {
        fieldsToUpdate.directorImage = presentation.directorImage;
    }

    await presentation.update(fieldsToUpdate);
    await presentation.reload(); 
    
    const contentBlocksForResponse = Array.isArray(presentation.contentBlocks) ? presentation.contentBlocks : [];
    
    const formattedBlocks = contentBlocksForResponse.map(block => {
      if (block.type === 'image' && block.url) {
        if (!block.url.startsWith('http://') && !block.url.startsWith('https://')) {
          return { 
            ...block, 
            url: getImageFullPath(block.url),
            originalWidth: block.originalWidth || null,
            originalHeight: block.originalHeight || null,
            width: block.width || null,
            height: block.height || null,
            sizeSliderValue: block.sizeSliderValue || 0,
          };
        }
      }
      return block;
    });

    let formattedDirectorImage = null;
    if (presentation.directorImage && !presentation.directorImage.startsWith('http://') && !presentation.directorImage.startsWith('https://')) {
        formattedDirectorImage = getImageFullPath(presentation.directorImage);
    } else {
        formattedDirectorImage = presentation.directorImage;
    }

    const responseData = {
      ...presentation.toJSON(), 
      contentBlocks: formattedBlocks, 
      directorImage: formattedDirectorImage,
    };
    console.log('[updateMainPresentation] Response data being sent:', JSON.stringify(responseData, null, 2));
    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error updating main presentation content:', error);
    if (req.files) {
      for (const key in req.files) {
        if (Array.isArray(req.files[key])) {
          req.files[key].forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error(`Error deleting newly uploaded file on update error: ${file.path}`, err);
            });
          });
        }
      }
    }
    next(error);
  } finally {
    console.log('--- END Backend (PresentationController - updateMainPresentation) ---');
  }
};
