import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, ZoomIn, ZoomOut } from 'lucide-react';
import getCroppedImg from '../utils/cropImage';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setIsCropping(true);
            const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageFile) {
                // Ensure it's a File object that matches file input formats
                const file = new File([croppedImageFile], 'profile-picture.jpg', { type: 'image/jpeg' });
                onCropComplete(file);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative bg-[#0a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 z-10 bg-[#0a1a1a]">
                        <div className="flex items-center space-x-2 text-white">
                            <Crop size={20} className="text-mustard-gold" />
                            <h3 className="font-bold">Crop Profile Photo</h3>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Cropper Area */}
                    <div className="relative w-full h-80 bg-black/50">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // 1:1 aspect ratio for profile photos
                            cropShape="round" // Visual guide for circle
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Controls & Features */}
                    <div className="p-6 space-y-6">
                        {/* Zoom Slider */}
                        <div className="flex items-center space-x-4">
                            <ZoomOut size={18} className="text-gray-400" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-mustard-gold"
                            />
                            <ZoomIn size={18} className="text-gray-400" />
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={onCancel}
                                disabled={isCropping}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isCropping}
                                className="flex-1 bg-gradient-to-r from-mustard-gold to-yellow-500 text-deep-teal font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-mustard-gold/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {isCropping ? (
                                    <span>Processing...</span>
                                ) : (
                                    <>
                                        <Crop size={16} />
                                        <span>Crop & Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ImageCropper;
