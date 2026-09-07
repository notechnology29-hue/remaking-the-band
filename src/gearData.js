export const masterGearList = [
  { id: 'tube_amp_800', name: 'Vintage Tube Amp', slot: 'amplifier', modifier: { hypeBonus: 10, stressPenalty: 5 }, description: 'Warm analog crunch that boosts purist appeal.' },
  { id: 'fuzz_pedal_mk2', name: 'Boutique Fuzz Pedal', slot: 'effects', modifier: { dramaBonus: 15, reliability: -5 }, description: 'Unpredictable fuzz that sparks intense media reactions.' },
  { id: 'ribbon_mic_44', name: 'Vintage Ribbon Mic', slot: 'microphone', modifier: { trustBonus: 10, hypeBonus: 5 }, description: 'Captures raw vocal nuances with pristine clarity.' },
  { id: 'multi_fx_processor', name: 'Digital Multi-FX Rig', slot: 'effects', modifier: { reliability: 10, stressPenalty: -5 }, description: 'Stable and clean, but strips away some analog grit.' },
]

export const sidekickStoreCatalog = [
  { id: 'mic_sm58_pro', name: 'Dynamic Live Mic', slot: 'vocalMic', cost: 180, role: 'Lead Vocals', modifier: { trustBonus: 5, stressPenalty: -3 }, description: 'Reliable workhorse mic that resists heavy stage feedback.' },
  { id: 'tube_preamp_vocal', name: 'Vintage Tube Preamp', slot: 'vocalMic', cost: 420, role: 'Lead Vocals', modifier: { hypeBonus: 15, trustBonus: 10 }, description: 'Adds rich harmonic saturation to lead vocal takes.' },
  { id: 'in_ear_pro', name: 'Pro In-Ear Monitors', slot: 'monitor', cost: 250, role: 'Lead Vocals', modifier: { stressPenalty: -10, reliability: 5 }, description: 'Keeps vocal pitch tight under chaotic stage pressure.' },
  { id: 'stack_amp_100w', name: '100W Half-Stack Amp', slot: 'amplifier', cost: 550, role: 'Guitar', modifier: { hypeBonus: 20, stressPenalty: 5 }, description: 'Loud cabinet power that fills any venue.' },
  { id: 'delay_pedal_space', name: 'Space Echo Pedal', slot: 'effects', cost: 220, role: 'Guitar', modifier: { dramaBonus: 10, hypeBonus: 5 }, description: 'Atmospheric analog tape delays for sweeping textures.' },
  { id: 'distortion_distortion_x', name: 'Heavy Metal Distortion', slot: 'effects', cost: 160, role: 'Guitar', modifier: { hypeBonus: 12, reliability: -5 }, description: 'Gritty distortion that cuts through the mix.' },
  { id: 'bass_rig_8x10', name: '8x10 Bass Cabinet', slot: 'bassRig', cost: 600, role: 'Bass', modifier: { trustBonus: 15, hypeBonus: 10 }, description: 'Massive low-end projection anchors the groove.' },
  { id: 'tube_di_box', name: 'Vacuum Tube DI', slot: 'preamp', cost: 280, role: 'Bass', modifier: { trustBonus: 8, stressPenalty: -4 }, description: 'Warm, pristine direct bass tones for the desk.' },
  { id: 'maple_drum_kit', name: 'Custom Maple Shell Kit', slot: 'drumKit', cost: 750, role: 'Drums', modifier: { hypeBonus: 25, trustBonus: 10 }, description: 'Top-tier drums with booming resonance and crack.' },
  { id: 'heavy_duty_stands', name: 'Braced Hardware Pack', slot: 'hardware', cost: 190, role: 'Drums', modifier: { reliability: 15, stressPenalty: -5 }, description: 'Hardware stands that survive aggressive playing.' },
]
