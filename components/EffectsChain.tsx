import React from 'react';

interface EffectsChainProps {
    reverbAmount: number;
    delayAmount: number;
    delayTime: number;
    filterFrequency: number;
    filterQ: number;
    onReverbChange: (value: number) => void;
    onDelayChange: (value: number) => void;
    onDelayTimeChange: (value: number) => void;
    onFilterFrequencyChange: (value: number) => void;
    onFilterQChange: (value: number) => void;
}

export function EffectsChain({
    reverbAmount,
    delayAmount,
    delayTime,
    filterFrequency,
    filterQ,
    onReverbChange,
    onDelayChange,
    onDelayTimeChange,
    onFilterFrequencyChange,
    onFilterQChange,
}: EffectsChainProps) {
    return (
        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl p-6 shadow-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Master Effects Chain
                </h2>
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Reverb Control */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                            </svg>
                            Reverb
                        </label>
                        <span className="text-xs font-mono text-purple-200 bg-purple-900/50 px-2 py-1 rounded">
                            {Math.round(reverbAmount * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={reverbAmount}
                        onChange={(e) => onReverbChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                    />
                    <div className="mt-2 h-1 bg-gradient-to-r from-purple-900 via-purple-500 to-purple-300 rounded-full opacity-30"></div>
                </div>

                {/* Delay Amount Control */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Delay Mix
                        </label>
                        <span className="text-xs font-mono text-blue-200 bg-blue-900/50 px-2 py-1 rounded">
                            {Math.round(delayAmount * 100)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={delayAmount}
                        onChange={(e) => onDelayChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                    <div className="mt-2 h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-300 rounded-full opacity-30"></div>
                </div>

                {/* Delay Time Control */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Delay Time
                        </label>
                        <span className="text-xs font-mono text-cyan-200 bg-cyan-900/50 px-2 py-1 rounded">
                            {delayTime === 0.25 ? '1/16' : delayTime === 0.5 ? '1/8' : delayTime === 1 ? '1/4' : delayTime === 2 ? '1/2' : '1 bar'}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.25"
                        max="4"
                        step="0.25"
                        value={delayTime}
                        onChange={(e) => onDelayTimeChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
                    />
                    <div className="mt-2 h-1 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-300 rounded-full opacity-30"></div>
                </div>

                {/* Filter Frequency Control */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-pink-500/20 hover:border-pink-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-pink-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                            </svg>
                            Filter Cutoff
                        </label>
                        <span className="text-xs font-mono text-pink-200 bg-pink-900/50 px-2 py-1 rounded">
                            {filterFrequency >= 20000 ? 'Open' : `${Math.round(filterFrequency)} Hz`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="200"
                        max="20000"
                        step="100"
                        value={filterFrequency}
                        onChange={(e) => onFilterFrequencyChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                    />
                    <div className="mt-2 h-1 bg-gradient-to-r from-pink-900 via-pink-500 to-pink-300 rounded-full opacity-30"></div>
                </div>

                {/* Filter Resonance Control */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            Resonance
                        </label>
                        <span className="text-xs font-mono text-orange-200 bg-orange-900/50 px-2 py-1 rounded">
                            {filterQ.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={filterQ}
                        onChange={(e) => onFilterQChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
                    />
                    <div className="mt-2 h-1 bg-gradient-to-r from-orange-900 via-orange-500 to-orange-300 rounded-full opacity-30"></div>
                </div>

                {/* Visual Analyzer */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-green-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                            Chain Status
                        </label>
                        <span className="text-xs text-green-200">Processing</span>
                    </div>
                    <div className="flex gap-1 h-12 items-end">
                        {[0.3, 0.5, 0.7, 0.6, 0.8, 0.4, 0.9, 0.5].map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-green-600 to-green-300 rounded-t transition-all duration-200"
                                style={{ height: `${height * 100}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Info Panel */}
            <div className="mt-6 p-4 bg-black/20 rounded-lg border border-gray-700/30">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-300 mb-1">
                            <span className="font-semibold text-blue-300">Professional Audio Chain:</span> Compressor → Reverb/Delay → Filter → Limiter
                        </p>
                        <p className="text-xs text-gray-400">
                            All effects are processed in real-time with studio-quality algorithms for maximum sonic clarity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
