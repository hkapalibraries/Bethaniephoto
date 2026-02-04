import React, { useState, useRef } from 'react';
import { AppState, GeminiModel, SceneId, SubjectMode, PoseMode, ProcessingConfig, ImageSize, AspectRatio } from './types';
import { SCENES } from './constants';
import CameraCapture, { CameraHandle } from './components/CameraCapture';
import ApiKeyInput from './components/ApiKeyInput';
import { generateComposite, editImageWithPrompt } from './services/geminiService';
import { uploadToImgBB } from './services/imgbbService';
import { addWatermark, convertBlobToBase64, cropTo916 } from './services/utils';

const App: React.FC = () => {
  const cameraRef = useRef<CameraHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consolidated State
  const [state, setState] = useState<AppState>(AppState.IDLE); // IDLE = Live Camera
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Configuration State
  const [config, setConfig] = useState<ProcessingConfig>({
    model: GeminiModel.FLASH,
    sceneId: SceneId.BOOK_COLLECTION,
    subjectMode: SubjectMode.SINGLE,
    poseMode: PoseMode.NATURAL,
    imgBbApiKey: '',
    imageSize: ImageSize.SIZE_1K,
    aspectRatio: AspectRatio.AR_9_16 // Hardcoded 9:16
  });

  // --- Actions ---

  const handleCapture = () => {
    if (cameraRef.current) {
      const img = cameraRef.current.capture();
      if (img) {
        setCapturedImage(img);
        setState(AppState.CONFIGURE); // CONFIGURE = Image Captured, Reviewing
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const rawBase64 = await convertBlobToBase64(file);
        const croppedBase64 = await cropTo916(rawBase64);
        setCapturedImage(croppedBase64);
        setState(AppState.CONFIGURE);
      } catch (err: any) {
        console.error(err);
        alert("Failed to load image: " + err.message);
      } finally {
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setProcessedImage(null);
    setPublicUrl(null);
    setErrorMsg(null);
    setState(AppState.IDLE);
  };

  // New function to go back to settings without clearing captured image
  const handleBackToConfigure = () => {
    setProcessedImage(null);
    setPublicUrl(null);
    setErrorMsg(null);
    setState(AppState.CONFIGURE);
  };

  const handleProcess = async () => {
    if (!capturedImage) return;
    setState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const resultBase64 = await generateComposite(capturedImage, config);
      const watermarked = await addWatermark(resultBase64);
      setProcessedImage(watermarked);
      setState(AppState.RESULT);
    } catch (err: any) {
      setErrorMsg(err.message || "Processing failed");
      setState(AppState.CONFIGURE); // Go back to review on error
    }
  };

  const handleEdit = async () => {
    if (!processedImage || !editPrompt) return;
    setIsEditing(true);
    try {
        const edited = await editImageWithPrompt(processedImage, editPrompt);
        const watermarked = await addWatermark(edited);
        setProcessedImage(watermarked);
        setEditPrompt(""); 
    } catch(err: any) {
        alert("Edit failed: " + err.message);
    } finally {
        setIsEditing(false);
    }
  };

  const handleShare = async () => {
    if (!processedImage || !config.imgBbApiKey) {
      alert("Please enter ImgBB API Key in settings.");
      return;
    }
    const btn = document.getElementById('share-btn');
    if(btn) btn.innerText = "Uploading...";

    try {
      const url = await uploadToImgBB(processedImage, config.imgBbApiKey);
      setPublicUrl(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
        if(btn) btn.innerText = "Generate QR Code";
    }
  };

  // --- Render Helpers ---

  const isLive = state === AppState.IDLE;
  const isReviewing = state === AppState.CONFIGURE;
  const isProcessing = state === AppState.PROCESSING;
  const isResult = state === AppState.RESULT;

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* --- Sidebar (Controls) --- */}
      {/* Mobile: Bottom Sheet (45vh height). Desktop: Left Sidebar (Full height, 96px width) */}
      <div className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-r border-slate-800 bg-slate-900 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-2xl h-[45vh] md:h-full rounded-t-3xl md:rounded-none">
        
        {/* Header */}
        <div className="px-6 pt-4 pb-2 md:p-6 md:border-b border-slate-800 shrink-0">
          <h1 className="font-display text-lg md:text-2xl text-white tracking-wide">
            AI brings you into <span className="text-yellow-500">HKAPA F/TV Library</span>
          </h1>
          <p className="hidden md:block text-xs text-slate-500 mt-1">Virtual Photo Booth • 9:16 Wallpaper Edition</p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 px-6 py-2 md:p-6 space-y-6 md:space-y-8 overflow-y-auto">
          
          {/* API Key */}
          <section>
             <ApiKeyInput value={config.imgBbApiKey} onChange={(val) => setConfig({...config, imgBbApiKey: val})} />
          </section>

          {/* Settings Group */}
          <div className={`space-y-6 md:space-y-8 transition-opacity ${isResult || isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Scene */}
            <section>
              <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2 md:mb-3">1. Background</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(SCENES).map((scene, idx) => {
                  const sId = Object.keys(SCENES)[idx] as SceneId;
                  const isActive = config.sceneId === sId;
                  return (
                    <button
                      key={sId}
                      onClick={() => setConfig({...config, sceneId: sId})}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isActive ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={scene.url} alt={scene.name} className="absolute inset-0 w-full h-full object-cover" />
                      {isActive && <div className="absolute inset-0 bg-yellow-500/20" />}
                      <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-white p-1 text-center font-bold truncate">
                        {scene.name}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Subject Mode */}
            <section>
              <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2 md:mb-3">2. Subject</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(SubjectMode).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setConfig({...config, subjectMode: mode})}
                    className={`px-3 py-2 rounded text-xs text-left font-medium transition-colors border ${config.subjectMode === mode ? 'bg-slate-100 text-slate-900 border-white' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* Pose & Model (Compact) */}
            <div className="grid grid-cols-2 gap-4 pb-4">
               <section>
                  <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">3. Pose</h3>
                  <select 
                    value={config.poseMode}
                    onChange={(e) => setConfig({...config, poseMode: e.target.value as PoseMode})}
                    className="w-full bg-slate-800 text-xs text-white p-2 rounded border border-slate-700 focus:border-yellow-500 outline-none"
                  >
                    {Object.values(PoseMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
               </section>
               <section>
                  <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2">4. Quality</h3>
                  <button 
                     onClick={() => setConfig({...config, model: config.model === GeminiModel.FLASH ? GeminiModel.PRO : GeminiModel.FLASH})}
                     className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs flex items-center justify-between hover:bg-slate-700"
                  >
                     <span>{config.model === GeminiModel.FLASH ? 'Flash' : 'Pro'}</span>
                     <div className={`w-2 h-2 rounded-full ${config.model === GeminiModel.FLASH ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                  </button>
               </section>
            </div>
          </div>

          {/* Result Controls */}
          {isResult && (
            <div className="pt-4 border-t border-slate-800 animate-fade-in pb-20">
              <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">AI Editor</h3>
              <div className="flex gap-2 mb-4">
                 <input 
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Add a red scarf"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs text-white"
                 />
                 <button 
                    onClick={handleEdit}
                    disabled={isEditing || !editPrompt}
                    className="bg-purple-600 px-3 rounded text-xs font-bold disabled:opacity-50"
                 >
                    {isEditing ? '...' : 'Apply'}
                 </button>
              </div>

               <h3 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">Export</h3>
               <div className="bg-white p-4 rounded-lg flex flex-col items-center justify-center min-h-[160px]">
                  {publicUrl ? (
                      <>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`} 
                            alt="QR Code" 
                            className="w-32 h-32"
                        />
                        <p className="text-slate-900 text-[10px] font-bold mt-2">Scan for Wallpaper</p>
                      </>
                  ) : (
                      <p className="text-slate-400 text-xs text-center">Click 'Generate QR Code' below.</p>
                  )}
               </div>
            </div>
          )}

        </div>

        {/* Action Bar (Sticky Bottom of Sidebar) */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 shrink-0">
           {isLive && (
             <div className="flex flex-col gap-2">
                 <button
                    onClick={handleCapture}
                    className="w-full py-3 md:py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-base md:text-lg uppercase tracking-widest rounded shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
                 >
                    Capture Photo
                 </button>
                 <button
                    onClick={triggerFileUpload}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider rounded transition-all"
                 >
                    or Upload Image
                 </button>
             </div>
           )}

           {(isReviewing || isProcessing) && (
             <div className="flex gap-3">
               <button
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded"
               >
                  Retake
               </button>
               <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="flex-[2] py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold rounded shadow-lg flex items-center justify-center gap-2"
               >
                  {isProcessing ? 'Synthesizing...' : 'Synthesize'}
               </button>
             </div>
           )}

           {isResult && (
             <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                   <button
                      onClick={handleBackToConfigure}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-yellow-500 border border-slate-700 hover:border-yellow-500 font-bold rounded transition-all"
                   >
                      Adjust / Regenerate
                   </button>
                   <button
                      id="share-btn"
                      onClick={handleShare}
                      disabled={!!publicUrl}
                      className={`flex-[1.5] py-3 font-bold rounded text-white shadow-lg ${publicUrl ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-500'}`}
                   >
                      {publicUrl ? 'Saved' : 'Get QR Code'}
                   </button>
                </div>
                <button
                  onClick={handleRetake}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest"
               >
                  Discard & Take New Photo
               </button>
             </div>
           )}

           {errorMsg && (
             <div className="text-red-400 text-xs text-center mt-2">{errorMsg}</div>
           )}
        </div>
      </div>

      {/* --- Main Viewport (Preview) --- */}
      {/* Mobile: Top area (55vh). Desktop: Right area (Flex-1) */}
      <div className="h-[55vh] md:h-auto md:flex-1 bg-black relative flex items-center justify-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-black shrink-0">
         
         {/* Phone Container (9:16) - Scale to fit height */}
         <div 
            className="relative h-[95%] md:h-[85%] w-auto aspect-[9/16] bg-black rounded-2xl shadow-2xl border-4 border-slate-800 overflow-hidden ring-1 ring-white/10"
         >
            {/* 1. Camera Feed */}
            {isLive && (
              <CameraCapture ref={cameraRef} className="w-full h-full" />
            )}

            {/* 2. Static Image (Captured or Processed) */}
            {(capturedImage || processedImage) && (
              <img 
                src={processedImage || capturedImage || ''} 
                className="w-full h-full object-cover animate-fade-in"
                alt="Preview"
              />
            )}

            {/* 3. Processing Overlay */}
            {isProcessing && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <div className="text-yellow-500 font-display text-xl animate-pulse">Processing</div>
               </div>
            )}
            
            {/* 4. Live Overlay Guide (Only in Live mode) */}
            {isLive && (
              <div className="absolute inset-0 pointer-events-none opacity-30">
                 <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50"></div>
                 <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50"></div>
                 <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50"></div>
                 <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50"></div>
                 <div className="absolute bottom-8 w-full text-center text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">
                    Position subject here
                 </div>
              </div>
            )}
         </div>

      </div>
    </div>
  );
};

export default App;