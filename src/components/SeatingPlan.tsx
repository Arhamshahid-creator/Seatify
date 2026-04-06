import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shuffle, ListOrdered, Printer, GraduationCap, User, Calendar, Hash, Info, Download, Image as ImageIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SeatingPlanProps {}

export default function SeatingPlan({}: SeatingPlanProps) {
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [session, setSession] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentCount, setStudentCount] = useState(40);
  const [seatingArrangement, setSeatingArrangement] = useState<string[]>([]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);

  const generateSequential = useCallback(() => {
    const numbers = Array.from({ length: studentCount }, (_, i) => (i + 1).toString());
    setSeatingArrangement(numbers);
  }, [studentCount]);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateShuffle = useCallback(() => {
    setSeatingArrangement(prev => {
      const base = prev.length === studentCount ? prev : Array.from({ length: studentCount }, (_, i) => (i + 1).toString());
      return shuffleArray(base);
    });
  }, [studentCount]);

  useEffect(() => {
    generateSequential();
  }, [generateSequential]);

  const handleEditRoll = (index: number, value: string) => {
    const newArrangement = [...seatingArrangement];
    newArrangement[index] = value.replace(/\D/g, '');
    setSeatingArrangement(newArrangement);
  };

  const handlePrint = () => {
    window.print();
  };

  const captureCanvas = async () => {
    if (!planRef.current) {
      setExportError('Seating plan element not found.');
      return null;
    }
    
    // Store current scroll position
    const scrollY = window.scrollY;
    // Scroll to top to avoid html2canvas offset issues
    window.scrollTo(0, 0);
    
    // Wait for any animations or layout shifts to settle
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const canvas = await html2canvas(planRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1100, // Force a wider capture width to include C5
        height: planRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1400, // Ensure the virtual window is wide enough
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('export-container');
          if (el) {
            el.style.width = '1100px';
            el.style.height = 'auto';
            el.style.margin = '0';
            el.style.padding = '20px';
            el.style.display = 'block';
            
            // Force all motion elements to be visible and static for capture
            const motionElements = el.querySelectorAll('.motion-item');
            motionElements.forEach((me: any) => {
              me.style.opacity = '1';
              me.style.transform = 'none';
              me.style.scale = '1';
              me.style.display = 'flex';
            });
          }
        }
      });
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
      return canvas;
    } catch (err) {
      console.error('Capture failed:', err);
      window.scrollTo(0, scrollY);
      setExportError(`Capture failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please use the "Print" button as a fallback.`);
      return null;
    }
  };

  const handleSaveImage = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      
      canvas.toBlob((blob) => {
        if (!blob) {
          setExportError('Failed to generate image blob.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Seating_Plan_${className || 'Class'}.jpg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      setExportError('Failed to save image.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSavePDF = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 1.5, canvas.height / 1.5]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      pdf.save(`Seating_Plan_${className || 'Class'}.pdf`);
    } catch (err) {
      setExportError('Failed to save PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Controls Section - Strictly Hidden on Print and excluded from Export Ref */}
        <div className="p-6 md:p-8 border-b border-slate-100 print:hidden">
          <section className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Name</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., 10th A"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Teacher</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g., Mr. Ahmed"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session</label>
                <input
                  type="text"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  placeholder="e.g., 2025-2026"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" /> Students
                </label>
                <input
                  type="number"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                onClick={generateShuffle}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </button>
              <button
                onClick={generateSequential}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ListOrdered className="w-4 h-4" />
                Sequential
              </button>
              <button
                onClick={handleSaveImage}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Save JPG'}
              </button>
              <button
                onClick={handleSavePDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Save PDF'}
              </button>
              <button
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            {exportError && (
              <div className="text-center text-sm font-semibold text-rose-600 bg-rose-50 py-2 rounded-lg border border-rose-200">
                {exportError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white py-2 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Tip: Click on any roll number in the grid to manually edit it.</span>
            </div>
          </section>
        </div>

        {/* Exportable Container - Only contains the data to be printed/saved */}
        <div ref={planRef} id="export-container" className="bg-white">
          {/* Header Section */}
          <header className="bg-slate-900 text-white p-8 text-center space-y-2 print:bg-slate-900 print:text-white">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              DIVISIONAL PUBLIC SCHOOL AND INTER COLLEGE SAHIWAL
            </h1>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-300 text-sm md:text-base">
              <p className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Class: <span className="text-white font-medium">{className || 'Not Provided'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Class Incharge: <span className="text-white font-medium">{teacherName || 'Not Provided'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Hash className="w-4 h-4" />
                Session: <span className="text-white font-medium">{session || 'Not Provided'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Date: <span className="text-white font-medium">
                  {startDate && endDate ? `${startDate} to ${endDate}` : 'Not Provided'}
                </span>
              </p>
            </div>
          </header>

          <div className="p-6 md:p-8 space-y-8">
            {/* Seating Grid Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Seating Plan</h2>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  {studentCount} Students
                </div>
              </div>

              <div className="space-y-4">
                {/* Column Labels */}
                <div className="grid grid-cols-5 gap-3 md:gap-4 px-2">
                  {['C1', 'C2', 'C3', 'C4', 'C5'].map((col) => (
                    <div key={col} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {col}
                    </div>
                  ))}
                </div>

                {/* Seats Grid */}
                <div className="grid grid-cols-5 gap-3 md:gap-4">
                  <AnimatePresence mode="popLayout">
                    {seatingArrangement.map((roll, idx) => (
                      <motion.div
                        key={`${idx}-${roll}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: idx * 0.005 }}
                        className={cn(
                          "motion-item group relative aspect-square md:aspect-video flex items-center justify-center rounded-lg border transition-all",
                          "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50",
                          "print:border-slate-300 print:bg-transparent print:rounded-none"
                        )}
                      >
                        <input
                          type="text"
                          value={roll}
                          onChange={(e) => handleEditRoll(idx, e.target.value)}
                          className={cn(
                            "w-full bg-transparent text-center font-bold text-lg md:text-xl outline-none",
                            "text-slate-700 group-hover:text-blue-600",
                            "print:text-slate-900 print:text-base"
                          )}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </section>
          </div>

          {/* Footer - Only for Print */}
          <footer className="hidden print:block p-8 pt-16">
            <div className="flex justify-between items-end border-t border-slate-300 pt-8">
              <div className="space-y-8">
                <div className="w-48 border-b border-slate-400"></div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Class Incharge Signature</p>
              </div>
              <div className="space-y-8 text-right">
                <div className="w-48 border-b border-slate-400 ml-auto"></div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Principal Signature</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
          .border {
            border-color: #e2e8f0 !important;
          }
          .bg-slate-900 {
            background-color: #1e293b !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:bg-slate-900 {
            background-color: #1e293b !important;
          }
          .print\\:text-white {
            color: white !important;
          }
        }
      `}</style>
    </div>
  );
}

