import { useEffect, useState } from 'react'
import './App.css'
import { masterScenarios } from './scenariosData'
import { masterGearList, sidekickStoreCatalog } from './gearData'
import { sidekickOpportunitiesCatalog } from './opportunitiesData'

const ROWS = 5
const COLS = 8
const STARTING_HOSTILITY = 80
const BASE_AP = 4
const BASE_MP = 3
const TIME_BLOCK_SECONDS = 300
const PHASES = { STUDIO: 'STUDIO', SPIN_ROOM: 'SPIN_ROOM', COMBAT: 'COMBAT', RECAP: 'RECAP' }
const roomCoordinates = {
  kitchen: { x: 12, y: 24 },
  tracking: { x: 58, y: 24 },
  loading: { x: 12, y: 70 },
  desk: { x: 58, y: 70 },
}

const initialBandState = [
  { id: 'ryan', name: 'Ryan Jolly', shortName: 'RJ', role: 'Lead Vocals', stamina: 10, stress: 86, trust: 48, passedOut: false, equippedGear: { vocalMic: 'ribbon_mic_44', monitor: null }, schedule: { morning: 'rest', noon: 'rest', night: 'rest' }, position: { row: 1, col: 1 }, color: 'coral', presence: 7 },
  { id: 'bryn', name: 'Bryn Fretz', shortName: 'BF', role: 'Guitar', stamina: 72, stress: 42, trust: 64, passedOut: false, equippedGear: { amplifier: 'tube_amp_800', effects: 'fuzz_pedal_mk2' }, schedule: { morning: 'rest', noon: 'rest', night: 'rest' }, position: { row: 3, col: 1 }, color: 'gold', presence: 6 },
  { id: 'cable', name: 'Cable Cooley', shortName: 'CC', role: 'Bass', stamina: 58, stress: 61, trust: 52, passedOut: false, equippedGear: { bassRig: 'tube_amp_800', preamp: 'fuzz_pedal_mk2' }, schedule: { morning: 'rest', noon: 'rest', night: 'rest' }, position: { row: 0, col: 2 }, color: 'blue', presence: 8 },
  { id: 'mikey', name: 'Mikey Stewert', shortName: 'MS', role: 'Drums', stamina: 80, stress: 34, trust: 67, passedOut: false, equippedGear: { drumKit: null, hardware: null }, schedule: { morning: 'rest', noon: 'rest', night: 'rest' }, position: { row: 4, col: 2 }, color: 'mint', presence: 7 },
]

function toCombatUnit(member) {
  const statusEffects = []
  let apModifier = 0
  let mpModifier = 0

  if (member.passedOut) {
    statusEffects.push('Passed out')
    apModifier = -6
    mpModifier = -3
  } else {
    if (member.stamina <= 15 && member.stress >= 70) {
      statusEffects.push('Volatile')
      apModifier = -1
    }
    if (member.stamina <= 25) {
      statusEffects.push('Exhausted')
      mpModifier = -1
    }
    if (member.stress >= 80) statusEffects.push('On edge')
  }

  return { ...member, statusEffects, apModifier, mpModifier }
}

const spriteImages = {
  ryan: '/assets/images/ryan.png',
  bryn: '/assets/images/bryn.png',
  cable: '/assets/images/cable.png',
  mikey: '/assets/images/mikey.png',
}

const cameraImages = ['/assets/images/crew1.png', '/assets/images/crew2.png']

const studioActivities = {
  rest: { label: 'Rest', location: 'Kitchen', stamina: 20, stress: -10, trust: 0, progress: 0, hype: 0, drama: -5 },
  woodshed: { label: 'Woodshed', location: 'Tracking Room', stamina: -15, stress: 10, trust: 0, progress: 5, hype: 10, drama: 0 },
  smoke: { label: 'Smoke break', location: 'Loading Dock', stamina: -5, stress: -30, trust: 5, progress: 0, hype: 0, drama: 10 },
  drink: { label: 'Drink alcohol', location: "Producer's Desk", stamina: -25, stress: -50, trust: -10, progress: 0, hype: -5, drama: 25 },
  groupJam: { label: 'Group jam', location: 'Tracking Room', stamina: -35, stress: 20, trust: 15, progress: 15, hype: 15, drama: 15 },
}

function roomForActivity(activity) {
  if (activity === 'woodshed' || activity === 'groupJam') return 'tracking'
  if (activity === 'smoke') return 'loading'
  if (activity === 'drink') return 'desk'
  return 'kitchen'
}

const attacks = [
  { id: 'fusion', name: 'Acoustic Fusion', key: 'A', cost: 2, mp: 0, description: 'A clean chord stack that cuts through the noise.', tone: 'clean' },
  { id: 'dive', name: 'Stage Dive', key: 'S', cost: 2, mp: 0, description: 'High-risk crowd contact. Spectacular if the roll lands.', tone: 'danger' },
]

const cells = Array.from({ length: ROWS * COLS }, (_, index) => ({
  row: Math.floor(index / COLS),
  col: index % COLS,
}))

function App() {
  const [bandState, setBandState] = useState(initialBandState)
  const [selectedId, setSelectedId] = useState('ryan')
  const [apSpent, setApSpent] = useState(0)
  const [mpSpent, setMpSpent] = useState(0)
  const [hostility, setHostility] = useState(STARTING_HOSTILITY)
  const [round, setRound] = useState(1)
  const [currentPhase, setCurrentPhase] = useState(PHASES.STUDIO)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [playerMoney, setPlayerMoney] = useState(1200)
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [gearInventory, setGearInventory] = useState(masterGearList.map((gear) => ({ ...gear, condition: gear.id === 'tube_amp_800' ? 85 : gear.id === 'fuzz_pedal_mk2' ? 40 : gear.id === 'ribbon_mic_44' ? 95 : 100, maxDurability: 100 })))
    const [equippedGear, setEquippedGear] = useState({ amplifier: 'tube_amp_800', effects: 'fuzz_pedal_mk2', microphone: 'ribbon_mic_44' })
  const [unlockedGear, setUnlockedGear] = useState(masterGearList.map((gear) => ({ ...gear, condition: gear.id === 'tube_amp_800' ? 85 : gear.id === 'fuzz_pedal_mk2' ? 40 : gear.id === 'ribbon_mic_44' ? 95 : 100, maxDurability: 100 })))
  const [studioUpgradeTier] = useState(3)
  const [episodeData, setEpisodeData] = useState({ songProgress: 0, hype: 0, drama: 0, editChoice: null, networkPayout: 0 })
  const [activeMenuTarget, setActiveMenuTarget] = useState(null)
  const [cameraTarget, setCameraTarget] = useState('auto')
  const [currentSlot, setCurrentSlot] = useState('morning')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isSimulationRunning, setIsSimulationRunning] = useState(true)
  const [isRiggingPhase, setIsRiggingPhase] = useState(true)
  const [hiddenCameraRoom, setHiddenCameraRoom] = useState(null)
  const [activeTextAlert, setActiveTextAlert] = useState(null)
  const [narrativeLog, setNarrativeLog] = useState([{ id: 1, timestamp: 'Day 1 / Morning', text: 'Network contract signed. Executives are watching the live feed closely.' }])
  const [lastNarrativeSlot, setLastNarrativeSlot] = useState(null)
  const [boringDays, setBoringDays] = useState(0)
  const [studioLog, setStudioLog] = useState('Tap a musician or the camera crew to open the Sidekick.')
  const [log, setLog] = useState('Select a performer. The crowd is already waiting for the first mistake.')
  const [lastRoll, setLastRoll] = useState(null)

  const units = bandState.map(toCombatUnit)
  const selectedUnit = units.find((unit) => unit.id === selectedId)
  const availableAp = Math.max(0, BASE_AP + (selectedUnit?.apModifier ?? 0) - apSpent)
  const availableMp = Math.max(0, BASE_MP + (selectedUnit?.mpModifier ?? 0) - mpSpent)

  function isAdjacent(position) {
    if (!selectedUnit) return false
    return Math.abs(position.row - selectedUnit.position.row) + Math.abs(position.col - selectedUnit.position.col) === 1
  }

  function moveTo(position) {
    if (!selectedUnit || availableMp < 1 || !isAdjacent(position)) return
    setBandState((currentBand) => currentBand.map((member) => member.id === selectedId ? { ...member, position } : member))
    setMpSpent((currentMpSpent) => currentMpSpent + 1)
    setLog(`${selectedUnit.name} moved into position. One MP spent.`)
  }

  function performAttack(attack) {
    if (!selectedUnit || availableAp < attack.cost || (attack.mp > 0 && availableMp < attack.mp) || hostility <= 0 || selectedUnit.passedOut) return
    const roll = Math.floor(Math.random() * 20) + 1
    const memberGearPenalty = getMemberGearModifiers(selectedUnit).reliabilityPenalty
    const modifier = selectedUnit.presence + Math.floor((selectedUnit.position.col + 1) / 2) - memberGearPenalty
    const effectiveRoll = Math.max(1, roll - memberGearPenalty)
    const damage = effectiveRoll >= 15 ? 30 : effectiveRoll >= 8 ? 15 : 5
    const nextHostility = Math.max(0, hostility - damage)
    setApSpent((currentApSpent) => currentApSpent + attack.cost)
    setMpSpent((currentMpSpent) => currentMpSpent + attack.mp)
    setHostility(nextHostility)
    applyGearWearAndTear(3)
    setLastRoll({ attack: attack.name, roll: effectiveRoll, damage, modifier })
    setLog(effectiveRoll >= 15 ? `CRITICAL STUNT! ${selectedUnit.name} landed ${attack.name} with a d20 roll of ${effectiveRoll}.` : effectiveRoll >= 8 ? `Solid performance by ${selectedUnit.name}: d20 roll ${effectiveRoll}.` : `BOTCHED STUNT! ${selectedUnit.name} fumbled ${attack.name} on a d20 roll of ${effectiveRoll}.`)
  }

  function endRound() {
    const nextBand = bandState.map((member) => {
      const crowdDamage = Math.floor(Math.random() * 15) + 5
      const stress = Math.min(100, member.stress + crowdDamage)
      return { ...member, stress, passedOut: member.passedOut || stress >= 100 }
    })
    setBandState(nextBand)
    applyGearWearAndTear(5)
    setRound((currentRound) => currentRound + 1)
    setApSpent(0)
    setMpSpent(0)
    setLastRoll(null)
    setSelectedId(null)
    setLog('The crowd surges forward and raises stress across the band. AP and MP refresh.')
    if (nextBand.every((member) => member.stamina <= 0 || member.stress >= 100)) {
      handleCombatDefeat(nextBand, 'Every member passed out from exhaustion and stress.')
    }
  }

  const isDefeated = hostility <= 0
  const isActionReady = (attack) => availableAp >= attack.cost && availableMp >= attack.mp && !isDefeated && !selectedUnit?.passedOut

  const averageStamina = Math.round(bandState.reduce((total, member) => total + member.stamina, 0) / bandState.length)
  const averageStress = Math.round(bandState.reduce((total, member) => total + member.stress, 0) / bandState.length)
  const averageTrust = Math.round(bandState.reduce((total, member) => total + member.trust, 0) / bandState.length)
  const hype = Math.max(0, Math.round(averageTrust + averageStamina * 0.35))
  const drama = Math.max(0, Math.round(averageStress + bandState.filter((member) => member.passedOut).length * 20))
  const networkPayout = 400 + hype * 8 + drama * 3

  function handleBuyOpportunity(opportunity) {
    if (playerMoney < opportunity.cost) {
      setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / Economy`, text: `TRANSACTION FAILED: Insufficient funds for ${opportunity.name}.` }, ...current])
      return
    }
    setPlayerMoney((money) => money - opportunity.cost)
    setBandState((currentBand) => currentBand.map((member) => ({ ...member, trust: Math.max(0, Math.min(100, member.trust + (opportunity.effect.trustBonus || opportunity.effect.trustPenalty || 0))), stress: Math.max(0, Math.min(100, member.stress + (opportunity.effect.stressPenalty || 0))) })))
    setEpisodeData((current) => ({ ...current, hype: current.hype + (opportunity.effect.hypeBonus || 0), drama: current.drama + (opportunity.effect.dramaBonus || 0) }))
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / Campaign`, text: `OPPORTUNITY SECURED: ${opportunity.name} purchased for $${opportunity.cost}.` }, ...current])
  }

  function handleBuyAndAssignGear(item) {
    if (playerMoney < item.cost) {
      setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / Gear`, text: `TRANSACTION FAILED: Not enough funds to buy ${item.name}.` }, ...current])
      return
    }
    const uniqueGearId = `${item.id}_${Date.now()}`
    const newGearItem = { ...item, id: uniqueGearId, condition: 100, maxDurability: 100 }
    masterGearList.push(newGearItem)
    setPlayerMoney((money) => money - item.cost)
    setGearInventory((inventory) => [...inventory, newGearItem])
    setUnlockedGear((inventory) => [...inventory, newGearItem])
    setBandState((currentBand) => currentBand.map((member) => member.role.toLowerCase() === item.role.toLowerCase() ? { ...member, equippedGear: { ...member.equippedGear, [item.slot]: uniqueGearId } } : member))
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / Gear`, text: `ACQUISITION: ${item.name} purchased and equipped for ${item.role} ($${item.cost}).` }, ...current])
  }

  const activeGear = Object.values(equippedGear).map((gearId) => gearInventory.find((gear) => gear.id === gearId)).filter((gear) => gear && gear.condition > 0)
  const gearModifiers = activeGear.reduce((total, gear) => ({
    hypeBonus: total.hypeBonus + (gear.modifier.hypeBonus || 0),
    dramaBonus: total.dramaBonus + (gear.modifier.dramaBonus || 0),
    stressPenalty: total.stressPenalty + (gear.modifier.stressPenalty || 0),
    trustBonus: total.trustBonus + (gear.modifier.trustBonus || 0),
  }), { hypeBonus: 0, dramaBonus: 0, stressPenalty: 0, trustBonus: 0 })

  const stageGearReliabilityPenalty = activeGear.filter((gear) => gear.condition < 30).length * 3

  function getMemberGearModifiers(member) {
    return Object.values(member.equippedGear || {}).map((gearId) => gearInventory.find((gear) => gear.id === gearId)).filter((gear) => gear && gear.condition > 0).reduce((total, gear) => ({
      hypeBonus: total.hypeBonus + (gear.modifier.hypeBonus || 0),
      dramaBonus: total.dramaBonus + (gear.modifier.dramaBonus || 0),
      stressPenalty: total.stressPenalty + (gear.modifier.stressPenalty || 0),
      trustBonus: total.trustBonus + (gear.modifier.trustBonus || 0),
      reliabilityPenalty: total.reliabilityPenalty + (gear.condition < 30 ? 3 : 0),
    }), { hypeBonus: 0, dramaBonus: 0, stressPenalty: 0, trustBonus: 0, reliabilityPenalty: 0 })
  }

  function applyGearWearAndTear(wearAmount) {
    const equippedIds = new Set(Object.values(equippedGear).filter(Boolean))
    const brokenItems = gearInventory.filter((item) => equippedIds.has(item.id) && item.condition > 0 && item.condition - wearAmount <= 0)
    setGearInventory((currentInventory) => currentInventory.map((item) => equippedIds.has(item.id) ? { ...item, condition: Math.max(0, item.condition - wearAmount) } : item))
    setUnlockedGear((currentInventory) => currentInventory.map((item) => equippedIds.has(item.id) ? { ...item, condition: Math.max(0, item.condition - wearAmount) } : item))
    if (brokenItems.length) {
      setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / Gear`, text: `GEAR FAILURE: ${brokenItems.map((item) => item.name).join(', ')} broke down completely under pressure.` }, ...current])
    }
  }

  function handleCombatDefeat(penalizedRoster, reason = 'The band was crushed by the crowd during the Weekend Set Piece.') {
    const resetRoster = penalizedRoster.map((member, index) => ({
      ...member,
      stamina: 20,
      stress: 100,
      trust: Math.max(0, member.trust - 25),
      passedOut: true,
      schedule: { morning: 'rest', noon: 'rest', night: 'rest' },
      position: initialBandState[index]?.position || member.position,
    }))
    setBandState(resetRoster)
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} - Finale`, text: `DEFEAT: ${reason} Trust shattered and stamina drained.` }, ...current])
    setCurrentWeek((week) => week + 1)
    setCurrentPhase(PHASES.STUDIO)
    setCurrentSlot('morning')
    setTimerSeconds(0)
    setIsRiggingPhase(true)
    setIsSimulationRunning(false)
    setHiddenCameraRoom(null)
    setActiveTextAlert(null)
    setHostility(STARTING_HOSTILITY)
    setRound(1)
    setApSpent(0)
    setMpSpent(0)
    setSelectedId('ryan')
    setLastRoll(null)
    setStudioLog(`Week ${currentWeek + 1} begins after a catastrophic Weekend Stage defeat.`)
  }

  function chooseAutonomousActivity(member) {
    if (member.passedOut || member.stamina <= 25) return 'rest'
    if (member.stress >= 80) return member.trust < 45 ? 'drink' : 'smoke'
    if (member.stress >= 60) return 'smoke'
    return Math.random() > 0.35 ? 'groupJam' : 'woodshed'
  }

  function triggerRivalBandEvent() {
    setActiveTextAlert({ sender: 'The Faux Fighters', memberId: 'ryan', message: 'Your rivals just leaked a diss track calling Fairwell a network plant. The crew wants a response before the clip dies.', options: [{ label: 'Ignore it (-Drama, protect Trust)', action: 'rival_ignore' }, { label: 'Fire back (+Drama, +Hype)', action: 'rival_fire' }] })
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: 'Day 1 / Noon', text: 'The Faux Fighters leaked a diss track aimed at Fairwell.' }, ...current])
  }

  function triggerKitchenArgument() {
    setActiveTextAlert({ sender: 'Crew B / Kitchen Cam', memberId: 'ryan', message: 'Ryan and Cable are fighting over the tracking-room gear. The hidden camera has a clean angle on the whole thing.', options: [{ label: 'Cut the feed (-Drama, +Trust)', action: 'argument_cut' }, { label: 'Keep rolling (+Drama, +Hype)', action: 'argument_roll' }] })
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: 'Day 1 / Night', text: 'Crew B captured a late-night kitchen argument over the gear.' }, ...current])
  }

  function triggerNetworkUltimatum() {
    setActiveTextAlert({ sender: 'Network Executive', memberId: 'ryan', message: 'The ratings are too clean. Give us a betrayal by dawn or the contract gets rewritten against Fairwell.', options: [{ label: 'Promise a confrontation (+Drama)', action: 'ultimatum_accept' }, { label: 'Protect the band (-Drama, +Trust)', action: 'ultimatum_pushback' }] })
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: 'Day 2 / Morning', text: 'The network issued an ultimatum after two quiet days.' }, ...current])
  }

  function triggerRandomScenario() {
    const scenario = masterScenarios[Math.floor(Math.random() * masterScenarios.length)]
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Week ${currentWeek} / ${currentSlot}`, text: `[${scenario.category.toUpperCase()}] ${scenario.description}` }, ...current])
    setActiveTextAlert({ sender: `Network Exec / ${scenario.category}`, message: scenario.description, scenario, options: [{ label: `Push for Success: ${scenario.success}`, action: 'scenario_success' }, { label: `Risk Failure: ${scenario.failure}`, action: 'scenario_failure' }] })
  }

  function advanceSimulationBlock() {
    const nextSlot = currentSlot === 'morning' ? 'noon' : currentSlot === 'noon' ? 'night' : 'morning'
    const nextBand = bandState.map((member) => {
      const activityKey = member.passedOut ? 'rest' : member.schedule[currentSlot]
      const impact = studioActivities[activityKey]
      const memberGear = getMemberGearModifiers(member)
      const stamina = Math.max(0, Math.min(100, member.stamina + impact.stamina))
      const stress = Math.max(0, Math.min(100, member.stress + impact.stress + memberGear.stressPenalty))
      return { ...member, stamina, stress, trust: Math.max(0, Math.min(100, member.trust + impact.trust + memberGear.trustBonus)), passedOut: stamina <= 0, schedule: { ...member.schedule, [nextSlot]: chooseAutonomousActivity({ ...member, stamina, stress }) } }
    })
    setBandState(nextBand)
    applyGearWearAndTear(4)
    const blockProgress = nextBand.reduce((total, member) => total + studioActivities[member.schedule[currentSlot]].progress, 0)
    const blockHype = nextBand.reduce((total, member) => total + studioActivities[member.schedule[currentSlot]].hype + getMemberGearModifiers(member).hypeBonus, 0)
    const blockDrama = nextBand.reduce((total, member) => total + studioActivities[member.schedule[currentSlot]].drama + getMemberGearModifiers(member).dramaBonus, 0)
    const hiddenDrama = hiddenCameraRoom && nextBand.some((member) => roomForActivity(member.schedule[currentSlot]) === hiddenCameraRoom) ? 12 : 0
    setEpisodeData((current) => ({ ...current, songProgress: Math.min(100, current.songProgress + blockProgress), hype: Math.max(0, current.hype + blockHype), drama: Math.max(0, current.drama + blockDrama + hiddenDrama) }))
    const rivalTriggered = currentSlot === 'morning' && Math.random() > 0.5
    if (rivalTriggered) triggerRivalBandEvent()
    if (currentSlot === 'noon') triggerKitchenArgument()
    if (currentSlot === 'night') {
      const quietBlock = blockHype + blockDrama + hiddenDrama < 10
      const nextBoringDays = quietBlock ? boringDays + 1 : 0
      setBoringDays(nextBoringDays)
      if (nextBoringDays >= 2) triggerNetworkUltimatum()
    }
    if (!rivalTriggered && currentSlot !== 'noon' && Math.random() > 0.65) triggerRandomScenario()
    const stressedMember = [...nextBand].sort((a, b) => b.stress - a.stress)[0]
    if (!activeTextAlert && !rivalTriggered && currentSlot !== 'noon' && stressedMember && stressedMember.stress > 60 && lastNarrativeSlot !== currentSlot) {
      setActiveTextAlert({ sender: stressedMember.name, memberId: stressedMember.id, message: 'I cannot stand the pressure in this room anymore. Should I walk out or trash the gear?', options: [{ label: 'Talk them down (-Stress, +Trust)', action: 'calm' }, { label: 'Provoke them for cameras (+Drama, +Hype)', action: 'provoke' }] })
      setLastNarrativeSlot(currentSlot)
    }
    if (currentSlot === 'night') {
      setStudioLog('The autonomous week is complete. The network is ready to cut the episode.')
      setCurrentPhase(PHASES.SPIN_ROOM)
      setIsSimulationRunning(false)
    } else {
      setCurrentSlot(nextSlot)
      setStudioLog(`${nextSlot[0].toUpperCase()}${nextSlot.slice(1)} block started. The band is moving on its own.`)
    }
  }

  useEffect(() => {
    if (currentPhase !== PHASES.STUDIO || !isSimulationRunning || isRiggingPhase || activeTextAlert) return undefined
    const interval = setInterval(() => {
      setTimerSeconds((currentSeconds) => Math.min(TIME_BLOCK_SECONDS, currentSeconds + 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentPhase, isSimulationRunning, isRiggingPhase, activeTextAlert, currentSlot, bandState])

  useEffect(() => {
    if (timerSeconds < TIME_BLOCK_SECONDS || currentPhase !== PHASES.STUDIO || !isSimulationRunning || isRiggingPhase || activeTextAlert) return
    setTimerSeconds(0)
    advanceSimulationBlock()
  }, [timerSeconds, currentPhase, isSimulationRunning, isRiggingPhase, activeTextAlert])

  function resolveNarrativeChoice(action) {
    if (!activeTextAlert) return
    const { memberId, sender } = activeTextAlert
    const isCalm = ['calm', 'rival_ignore', 'argument_cut', 'ultimatum_pushback'].includes(action)
    const isHype = ['provoke', 'rival_fire', 'argument_roll', 'scenario_success'].includes(action)
    const scenarioSuccess = action === 'scenario_success'
    setBandState((currentBand) => currentBand.map((member) => member.id === memberId ? { ...member, stamina: Math.max(0, Math.min(100, member.stamina + (scenarioSuccess ? 5 : 0))), stress: Math.max(0, Math.min(100, member.stress + (isCalm ? -20 : scenarioSuccess ? 0 : 20))), trust: Math.max(0, Math.min(100, member.trust + (isCalm ? 10 : scenarioSuccess ? 5 : -4))) } : member))
    setEpisodeData((current) => ({ ...current, hype: Math.max(0, current.hype + (isHype ? 10 : 0)), drama: Math.max(0, current.drama + (isCalm || scenarioSuccess ? 0 : 20)) }))
    setNarrativeLog((current) => [{ id: Date.now(), timestamp: `Day 1 / ${currentSlot}`, text: `Resolved text from ${sender}: ${isCalm ? 'talked them down' : 'provoke for cameras'}.` }, ...current])
    setActiveTextAlert(null)
  }

  function handleSkipTimeBlock() {
    if (isRiggingPhase) return
    if (currentSlot === 'night') {
      setCurrentSlot('morning')
      setCurrentDayIndex((day) => Math.min(6, day + 1))
      setTimerSeconds(0)
      setHiddenCameraRoom(null)
      setIsRiggingPhase(true)
      setStudioLog('A new day begins. Choose the room the network will never know about.')
      return
    }
    setTimerSeconds(0)
    advanceSimulationBlock()
  }

  function updateSchedule(memberId, slot, activity) {
    if (slot === '__gear__') {
      setBandState((currentBand) => currentBand.map((member) => member.id === memberId ? { ...member, equippedGear: { ...member.equippedGear, [activity.slot]: activity.gearId } } : member))
      return
    }
    setBandState((currentBand) => currentBand.map((member) => member.id === memberId ? { ...member, schedule: { ...member.schedule, [slot]: activity } } : member))
  }

  function executeStudioDay() {
    const nextBand = bandState.map((member) => {
      const impacts = Object.values(member.schedule).reduce((totals, activityKey) => {
        const impact = studioActivities[activityKey]
        return { stamina: totals.stamina + impact.stamina, stress: totals.stress + impact.stress, trust: totals.trust + impact.trust }
      }, { stamina: member.stamina, stress: member.stress, trust: member.trust })
      const stamina = Math.max(0, Math.min(100, impacts.stamina))
      return { ...member, stamina, stress: Math.max(0, Math.min(100, impacts.stress)), trust: Math.max(0, Math.min(100, impacts.trust)), passedOut: stamina <= 0 }
    })
    setBandState(nextBand)
    const studioProgress = nextBand.reduce((total, member) => total + Object.values(member.schedule).reduce((sum, activity) => sum + studioActivities[activity].progress, 0), 0)
    const nextHype = Math.max(0, hype)
    const nextDrama = Math.max(0, drama)
    setEpisodeData((current) => ({ ...current, songProgress: Math.min(100, current.songProgress + studioProgress), hype: nextHype, drama: nextDrama, networkPayout: 400 + nextHype * 8 + nextDrama * 3 }))
    setCurrentSlot('night')
    setTimerSeconds(0)
    setStudioLog('The cameras caught the day. Review the consequences before the Weekend Stage.')
    setCurrentPhase(PHASES.SPIN_ROOM)
    setActiveMenuTarget(null)
  }

  function chooseEdit(editChoice) {
    const trustDelta = editChoice === 'villain' ? -8 : 6
    const hypeDelta = editChoice === 'villain' ? 8 : 14
    setBandState((currentBand) => currentBand.map((member) => ({ ...member, trust: Math.max(0, Math.min(100, member.trust + trustDelta)) })))
    setEpisodeData((current) => ({ ...current, editChoice, hype: current.hype + hypeDelta, networkPayout: current.networkPayout + (editChoice === 'villain' ? 350 : 150) }))
    setCurrentPhase(PHASES.COMBAT)
  }

  function finishCombat() {
    setCurrentPhase(PHASES.RECAP)
  }

  updateSchedule.playerMoney = playerMoney
  updateSchedule.monitorData = { band: bandState, week: currentWeek, hype, drama, money: playerMoney }
  updateSchedule.gearInventory = gearInventory
  updateSchedule.handleBuyOpportunity = handleBuyOpportunity
  handleBuyOpportunity.handleBuyAndAssignGear = handleBuyAndAssignGear
  updateSchedule.handleBuyAndAssignGear = handleBuyAndAssignGear
  setEquippedGear.monitorData = { band: bandState, week: currentWeek, hype, drama, money: playerMoney }

  if (currentPhase === PHASES.STUDIO) {
    return <><StudioPhase week={currentWeek} band={bandState} currentSlot={currentSlot} timerSeconds={timerSeconds} isSimulationRunning={isSimulationRunning} setIsSimulationRunning={setIsSimulationRunning} isRiggingPhase={isRiggingPhase} setIsRiggingPhase={setIsRiggingPhase} hiddenCameraRoom={hiddenCameraRoom} setHiddenCameraRoom={setHiddenCameraRoom} onSkipTimeBlock={handleSkipTimeBlock} activeMenuTarget={activeMenuTarget} setActiveMenuTarget={setActiveMenuTarget} cameraTarget={cameraTarget} setCameraTarget={setCameraTarget} updateSchedule={updateSchedule} onExecute={executeStudioDay} log={studioLog} narrativeLog={narrativeLog} /><div className="week-badge">WEEK {currentWeek}</div><GearPanel unlockedGear={unlockedGear} equippedGear={equippedGear} setEquippedGear={setEquippedGear} studioUpgradeTier={studioUpgradeTier} /><button className="floating-skip-time" onClick={handleSkipTimeBlock} disabled={isRiggingPhase || Boolean(activeTextAlert)}>Skip time <span>»</span></button>{hiddenCameraRoom && <BugMarker room={hiddenCameraRoom} />}{isRiggingPhase && <RiggingOverlay hiddenCameraRoom={hiddenCameraRoom} setHiddenCameraRoom={setHiddenCameraRoom} onStart={() => { setIsRiggingPhase(false); setTimerSeconds(0); setIsSimulationRunning(true) }} />}{activeTextAlert && <NarrativeAlert alert={activeTextAlert} onResolve={resolveNarrativeChoice} />}</>
  }

  if (currentPhase === PHASES.SPIN_ROOM) {
    return <DeviceShell phase="SPIN ROOM" alert="EDIT REQUIRED"><SpinRoom episodeData={{ ...episodeData, hype, drama, networkPayout }} band={units} onChooseEdit={chooseEdit} /></DeviceShell>
  }

  if (currentPhase === PHASES.RECAP) {
    return <DeviceShell phase="EPISODE RECAP" alert="BROADCAST COMPLETE"><EpisodeRecap episodeData={{ ...episodeData, hype, drama, networkPayout }} band={units} onReplay={() => { setHostility(STARTING_HOSTILITY); setRound(1); setCurrentPhase(PHASES.STUDIO) }} /></DeviceShell>
  }

  return (
    <DeviceShell phase="WEEKEND STAGE" alert={isDefeated ? 'CROWD SUBDUED' : 'LIVE CAMERA FEED'}>
      <main className="tactical-app">
      <header className="tactical-header">
        <div className="brand-lockup"><span className="brand-kicker">Remaking the Band</span><span className="brand-title">MILESTONE 02 / WEEKEND STAGE</span></div>
        <div className="round-marker"><span>Round</span><strong>{String(round).padStart(2, '0')}</strong></div>
      </header>

      <section className="tactical-intro">
        <div><p className="eyebrow">Fairwell · Tactical performance</p><h1>Hold the stage.</h1><p>Position the band, spend the moment, and turn public pressure into a comeback.</p></div>
        <div className="hostility-readout"><span>Crowd hostility</span><strong>{hostility}%</strong><div className="hostility-track"><i style={{ width: `${hostility}%` }} /></div><small>{isDefeated ? 'Crowd subdued. The room is yours.' : 'Hecklers are closing in.'}</small></div>
      </section>

      <section className="combat-layout">
        <aside className="combat-panel unit-panel">
          <div className="panel-label">01 / Fairwell</div><h2>On stage</h2>
          <div className="unit-list">{units.map((unit) => <button className={`unit-card ${unit.color} ${selectedId === unit.id ? 'selected' : ''}`} key={unit.id} onClick={() => setSelectedId(unit.id)}><span className="unit-initials">{unit.shortName}</span><span><strong>{unit.name}</strong><small>{unit.role} · {unit.stamina}% stamina / {unit.stress}% stress</small><em>{unit.statusEffects.length ? unit.statusEffects.join(' · ') : 'Stable'}</em></span><b>{selectedId === unit.id ? 'ACTIVE' : 'SELECT'}</b></button>)}</div>
          <div className="resource-block"><div><span>Action points</span><strong>{availableAp}<small> / {Math.max(0, BASE_AP + (selectedUnit?.apModifier ?? 0))} AP</small></strong></div><div className="resource-bar"><i style={{ width: `${(availableAp / Math.max(1, BASE_AP + (selectedUnit?.apModifier ?? 0))) * 100}%` }} /></div><div><span>Movement points</span><strong>{availableMp}<small> / {Math.max(0, BASE_MP + (selectedUnit?.mpModifier ?? 0))} MP</small></strong></div><div className="resource-bar movement"><i style={{ width: `${(availableMp / Math.max(1, BASE_MP + (selectedUnit?.mpModifier ?? 0))) * 100}%` }} /></div></div>
        </aside>

        <section className="stage-panel" aria-label="Tactical stage">
          <div className="stage-toolbar"><div><span className="panel-label">02 / Tactical canvas</span><h2>Weekend Stage</h2></div><div className="legend"><span><i className="legend-dot band-dot" /> Band</span><span><i className="legend-dot crowd-dot" /> Hecklers</span><span><i className="legend-dot hazard-dot" /> Hazard</span></div></div>
          <div className="stage-grid">{cells.map((cell) => <StageCell key={`${cell.row}-${cell.col}`} cell={cell} unit={units.find((item) => item.position.row === cell.row && item.position.col === cell.col)} selectedUnit={selectedUnit} onSelect={setSelectedId} onMove={moveTo} />)}</div>
          <div className="stage-foot"><span>← Band territory</span><span>Audience pressure →</span></div>
        </section>

        <aside className="combat-panel action-panel">
          <div className="panel-label">03 / Performance actions</div><h2>Make noise</h2>
          <p className="selected-readout">Active: <strong>{selectedUnit?.name}</strong><br /><small>{selectedUnit?.statusEffects.length ? selectedUnit.statusEffects.join(' · ') : 'No status effects'} · AP {selectedUnit?.apModifier >= 0 ? '+' : ''}{selectedUnit?.apModifier ?? 0} / MP {selectedUnit?.mpModifier >= 0 ? '+' : ''}{selectedUnit?.mpModifier ?? 0}</small><br /><small>Click an adjacent tile to move. Spend AP to attack.</small></p>
          <div className="attack-list">{attacks.map((attack) => <button className={`attack-button ${attack.tone}`} key={attack.id} disabled={!isActionReady(attack)} onClick={() => performAttack(attack)}><span className="attack-key">{attack.key}</span><span><strong>{attack.name}</strong><small>{attack.description}</small></span><b>{attack.cost} AP{attack.mp ? ` + ${attack.mp} MP` : ''}</b></button>)}</div>
          {lastRoll && <div className="roll-result"><span>Last roll / d20</span><strong>{lastRoll.roll}</strong><p>{lastRoll.attack} dealt <b>{lastRoll.damage}</b> hostility damage.</p></div>}
          <button className="end-round" onClick={endRound}>End turn / crowd retaliates <span>↗</span></button>
        </aside>
      </section>

      <footer className="combat-log"><span>Live call</span>{log}<b>{isDefeated ? <button className="recap-link" onClick={finishCombat}>EPISODE RECAP →</button> : 'LIVE'}</b></footer>
      </main>
    </DeviceShell>
  )
}

function DeviceShell({ phase, alert, children }) {
  return <div className="phone-device"><div className="phone-speaker" aria-hidden="true" /><div className="phone-screen"><header className="phone-status"><span>9:41</span><span className="phone-status-center">FAIRWELL NETWORK</span><span>▮▮▮ ◉</span></header><div className="phone-alert"><span className="phone-alert-dot" /> {alert}<b>{phase}</b></div>{children}</div><div className="phone-home" aria-hidden="true" /></div>
}

function RiggingOverlay({ hiddenCameraRoom, setHiddenCameraRoom, onStart }) {
  return <div className="rigging-overlay"><section className="rigging-modal"><p className="eyebrow">Morning / covert production</p><h2>Rig hidden cameras</h2><p>Select one room to bug before the band wakes up. Hidden footage adds drama to the broadcast.</p><div className="rigging-rooms">{['kitchen', 'tracking', 'loading', 'desk'].map((room) => <button className={hiddenCameraRoom === room ? 'selected' : ''} key={room} onClick={() => setHiddenCameraRoom(room)}>{room}{hiddenCameraRoom === room && '  •'}</button>)}</div><button className="lock-rig" disabled={!hiddenCameraRoom} onClick={onStart}>Lock rig & start day <span>→</span></button></section></div>
}

function BugMarker({ room }) {
  const markerPosition = { kitchen: { left: '8%', top: '8%' }, tracking: { left: '55%', top: '8%' }, loading: { left: '8%', top: '58%' }, desk: { left: '55%', top: '58%' } }[room]
  return <div className="bug-marker" style={markerPosition}>REC / BUGGED</div>
}

function GearPanel({ unlockedGear, equippedGear, setEquippedGear, studioUpgradeTier }) {
  const slots = ['amplifier', 'effects', 'microphone']
  return <><ProductionMonitor data={setEquippedGear.monitorData} /><aside className="gear-panel"><strong>GARAGE RIG / TIER {studioUpgradeTier}</strong>{slots.map((slot) => <label key={slot}><span>{slot}</span><select value={equippedGear[slot] || ''} onChange={(event) => setEquippedGear((current) => ({ ...current, [slot]: event.target.value || null }))}><option value="">Empty</option>{unlockedGear.map((gearRef) => { const gear = typeof gearRef === 'string' ? masterGearList.find((item) => item.id === gearRef) : gearRef; return gear?.slot === slot ? <option value={gear.id} key={gear.id}>{gear.name} ({gear.condition}%)</option> : null })}</select></label>)}</aside></>
}

function ProductionMonitor({ data }) {
  if (!data) return null
  return <section className="production-monitor"><header><strong>SHOWRUNNER_MONITOR_OS // LIVE FEED & METRICS</strong><span>FINANCIAL BAL: <b>${data.money}</b></span></header><div className="monitor-metrics"><span>NETWORK DRAMA <b>{data.drama}</b></span><span>PURIST HYPE <b>{data.hype}</b></span><span>WEEKLY CAMPAIGN <b>Week {data.week}</b></span></div><small>ROSTER TELEMETRY & STAT TRACKER</small><div className="monitor-roster">{data.band.map((member) => <article key={member.id}><strong>{member.name.toUpperCase()}</strong><span>STA {member.stamina}%</span><span>STR {member.stress}%</span><span>TRU {member.trust}%</span><em>{member.role}</em></article>)}</div></section>
}

function NarrativeAlert({ alert, onResolve }) {
  return <div className="narrative-overlay"><section className="narrative-modal"><strong className="lcd-title">MESSAGE FROM: {alert.sender.toUpperCase()}</strong><p>“{alert.message}”</p><div>{alert.options.map((option) => <button key={option.action} onClick={() => onResolve(option.action)}>→ {option.label}</button>)}</div></section></div>
}

function StudioPhase({ week, band, currentSlot, timerSeconds, isSimulationRunning, setIsSimulationRunning, isRiggingPhase, setIsRiggingPhase, hiddenCameraRoom, setHiddenCameraRoom, onSkipTimeBlock, activeMenuTarget, setActiveMenuTarget, cameraTarget, setCameraTarget, updateSchedule, onExecute, log, narrativeLog }) {
  const cameraMember = cameraTarget === 'auto' ? [...band].sort((a, b) => (b.stress - b.stamina) - (a.stress - a.stamina))[0] : band.find((member) => String(member.id) === String(cameraTarget))
  const manualCameraRoom = cameraTarget.startsWith('room:') ? cameraTarget.slice(5) : null
  const cameraPosition = manualCameraRoom ? roomCoordinates[manualCameraRoom] : cameraMember ? getStudioPosition(cameraMember, currentSlot, 0) : { x: 45, y: 45 }
  const progress = Math.round((timerSeconds / TIME_BLOCK_SECONDS) * 100)
  return <main className="compound-app"><header className="compound-header"><div className="brand-lockup"><span className="brand-kicker">Remaking the Band</span><span className="brand-title">SIDEKICK OS / STUDIO COMPOUND</span></div><div className="compound-day"><span>Current slot</span><strong>{currentSlot}</strong></div></header><section className="compound-intro"><div><p className="eyebrow">Fairwell · Studio Phase</p><h1>Watch them work.</h1><p>{log}</p></div><div className="simulation-controls"><div className="simulation-clock"><span>Block progress</span><strong>{progress}%</strong><i><b style={{ width: `${progress}%` }} /></i></div><button className="roll-studio" onClick={() => setIsSimulationRunning((running) => !running)}>{isSimulationRunning ? 'Pause simulation' : 'Resume simulation'} <span>{isSimulationRunning ? 'Ⅱ' : '▶'}</span></button></div></section><section className="compound-canvas" aria-label="Studio compound"><div className="compound-room kitchen-room"><span>01 / Kitchen</span><small>Rest & recovery</small></div><div className="compound-room tracking-room"><span>02 / Tracking Room</span><small>Woodshed & group jam</small></div><div className="compound-room loading-room"><span>03 / Loading Dock</span><small>Smoke break</small></div><div className="compound-room desk-room"><span>04 / Producer Desk</span><small>Network pressure</small></div>{band.map((member, index) => { const position = getStudioPosition(member, currentSlot, index); return <button key={member.id} className={`compound-sprite ${member.color} ${activeMenuTarget === member.id ? 'sprite-selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => setActiveMenuTarget(member.id)}><strong>{member.shortName}</strong><small>{member.name.split(' ')[0]}</small>{member.passedOut && <b>OUT</b>}</button> })}<button className={`camera-crew ${activeMenuTarget === 'camera' ? 'camera-selected' : ''}`} style={{ left: `${cameraPosition.x + 5}%`, top: `${cameraPosition.y - 5}%` }} onClick={() => setActiveMenuTarget('camera')}><strong>CAM</strong><small>crew</small></button></section><p className="compound-hint"><span>Autonomous compound</span> sprites move on the {currentSlot} clock. Tap one to open the Sidekick; the camera crew follows {cameraMember?.name || 'the room'}.</p>{activeMenuTarget && <SidekickUI activeMenuTarget={activeMenuTarget} band={band} cameraTarget={cameraTarget} setCameraTarget={setCameraTarget} updateSchedule={updateSchedule} closePhone={() => setActiveMenuTarget(null)} narrativeLog={narrativeLog} />}</main>
}

function getStudioPosition(member, currentSlot, index) {
  const activity = member.passedOut ? 'rest' : member.schedule[currentSlot]
  const room = roomForActivity(activity)
  const base = roomCoordinates[room]
  return { x: base.x + (index % 2) * 15, y: base.y + Math.floor(index / 2) * 14 }
}

function SidekickUI({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  return <CompleteSidekickPhone activeMenuTarget={activeMenuTarget} band={band} cameraTarget={cameraTarget} setCameraTarget={setCameraTarget} updateSchedule={updateSchedule} closePhone={closePhone} narrativeLog={narrativeLog} />
  /* Legacy phone markup retained below as a reference while the LCD view is iterated. */
  const targetMember = band.find((member) => member.id === activeMenuTarget)
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>BAT 84%</span></div><div className="sidekick-screen">{targetMember && <div><p className="phone-kicker">MEMBER CALL SHEET</p><h2>{targetMember.name}</h2><div className="phone-stats"><span>STA <b>{targetMember.stamina}%</b></span><span>STR <b>{targetMember.stress}%</b></span><span>TRU <b>{targetMember.trust}%</b></span></div><p className="phone-status-line">{toCombatUnit(targetMember).statusEffects.join(' · ') || 'Stable'} </p>{!targetMember.passedOut ? <div className="phone-schedule">{['morning', 'noon', 'night'].map((slot) => <label key={slot}><span>{slot}</span><select value={targetMember.schedule[slot]} onChange={(event) => updateSchedule(targetMember.id, slot, event.target.value)}>{Object.entries(studioActivities).map(([key, activity]) => <option value={key} key={key}>{activity.label}</option>)}</select></label>)}</div> : <p className="phone-warning">CHARACTER IS UNCONSCIOUS.<br />Locked in recovery.</p>}</div>}{activeMenuTarget === 'camera' && <div><p className="phone-kicker">PRODUCER CONTROLS</p><h2>Camera Crew</h2><p className="phone-copy">Choose what the network sees and who gets the close-up.</p><label className="phone-field"><span>Camera target</span><select value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow volatility</option>{band.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}<option value="off">Cut the feed</option></select></label><div className="phone-ratings"><span>HYPE <b>{Math.round(band.reduce((total, member) => total + member.trust, 0) / band.length)}</b></span><span>DRAMA <b>{Math.round(band.reduce((total, member) => total + member.stress, 0) / band.length)}</b></span></div></div>}<div className="sidekick-home"><button onClick={closePhone}>MENU</button><button onClick={closePhone}>BACK</button><button onClick={closePhone}>CLOSE</button></div></div></aside>
}

function CompleteSidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const [tab, setTab] = useState('monitor')
  const data = updateSchedule.monitorData || { band, week: 1, hype: 0, drama: 0, money: updateSchedule.playerMoney || 0 }
  const availableGear = updateSchedule.gearInventory || masterGearList
  const tabs = [['monitor', 'HOME'], ['routes', 'ROUTES'], ['gear', 'GEAR'], ['opps', 'STORE'], ['story', 'STORY']]
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>${data.money}</span></div><div className="sidekick-tabs">{tabs.map(([id, label]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>{label}</button>)}</div><div className="sidekick-lcd">{tab === 'monitor' && <MonitorLCD data={data} />}{tab === 'opps' && <OpportunityView money={data.money} onBuy={updateSchedule.handleBuyOpportunity} />}{tab === 'story' && <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE</strong>{narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>)}</div>}{tab === 'routes' && <div><strong className="lcd-title">COMPOUND ROUTES</strong><select className="lcd-select" value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow drama</option><option value="room:kitchen">Kitchen</option><option value="room:tracking">Tracking Room</option><option value="room:loading">Loading Dock</option><option value="room:desk">Producer Desk</option>{band.map((member) => <option value={member.id} key={member.id}>Follow {member.name}</option>)}</select>{band.map((member) => <article className="route-member" key={member.id}><strong>{member.name}</strong><div>{Object.entries({ kitchen: 'rest', tracking: 'groupJam', loading: 'smoke', desk: 'drink' }).map(([room, activity]) => <button key={room} onClick={() => updateSchedule(member.id, 'morning', activity)}>{room}</button>)}</div></article>)}</div>}{tab === 'gear' && <div><strong className="lcd-title">PERSONAL LOADOUTS</strong>{band.map((member) => <article className="member-loadout" key={member.id}><strong>{member.name}</strong>{Object.entries(member.equippedGear || {}).map(([slot, gearId]) => <label key={slot}><span>{slot}</span><select value={gearId || ''} onChange={(event) => updateSchedule(member.id, '__gear__', { slot, gearId: event.target.value || null })}><option value="">None</option>{masterGearList.filter((gear) => gear.slot === slot).map((gear) => <option value={gear.id} key={gear.id}>{gear.name}</option>)}</select></label>)}</article>)}</div>}{tab === 'store' && <div><strong className="lcd-title">FIELD GEAR STORE</strong>{masterGearList.map((gear) => <article className="gear-store-item" key={gear.id}><strong>{gear.name}</strong><span>{gear.description}</span></article>)}</div>}<div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setTab('monitor')}>HOME</button><button className="sidekick-btn" onClick={() => setTab('monitor')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div></div></aside>
}

function HomeSidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const data = updateSchedule.monitorData || { band, week: 1, hype: 0, drama: 0, money: updateSchedule.playerMoney || 0 }
  const [tab, setTab] = useState('home')
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>${data.money}</span></div><div className="sidekick-tabs"><button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>HOME</button><button className={tab === 'opps' ? 'active' : ''} onClick={() => setTab('opps')}>OPPS</button><button className={tab === 'story' ? 'active' : ''} onClick={() => setTab('story')}>STORY</button></div><div className="sidekick-lcd">{tab === 'home' && <MonitorLCD data={data} />}{tab === 'opps' && <OpportunityView money={data.money} onBuy={updateSchedule.handleBuyOpportunity} />}{tab === 'story' && <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE</strong>{narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>)}</div>}<div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setTab('home')}>HOME</button><button className="sidekick-btn" onClick={() => setTab('home')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div></div></aside>
}

function MonitorLCD({ data }) {
  return <div className="lcd-monitor"><strong className="lcd-title">SHOWRUNNER MONITOR</strong><div className="monitor-lcd-metrics"><span>FUNDS<b>${data.money}</b></span><span>DRAMA<b>{data.drama}</b></span><span>HYPE<b>{data.hype}</b></span><span>WEEK<b>{data.week}</b></span></div><p className="lcd-label">ROSTER TELEMETRY</p>{data.band.map((member) => <article key={member.id}><strong>{member.name}</strong><span>STA {member.stamina}% · STR {member.stress}% · TRU {member.trust}%</span><small>{member.role}</small></article>)}</div>
}

function OpportunityView({ money, onBuy }) {
  return <div><strong className="lcd-title">OPPORTUNITIES / ${money}</strong>{sidekickOpportunitiesCatalog.map((item) => <article className="gear-store-item" key={item.id}><strong>{item.name} · ${item.cost}</strong><span>{item.description}</span><button className="opp-buy" disabled={!onBuy || money < item.cost} onClick={() => onBuy(item)}>BOOK FEATURE</button></article>)}<strong className="lcd-title">MOBILE GEAR SHOP</strong>{sidekickStoreCatalog.map((item) => <article className="gear-store-item" key={item.id}><strong>{item.name} · ${item.cost}</strong><span>{item.role} / {item.slot}</span><small>{item.description}</small><button className="opp-buy" disabled={!onBuy?.handleBuyAndAssignGear || money < item.cost} onClick={() => onBuy.handleBuyAndAssignGear(item)}>BUY & EQUIP</button></article>)}</div>
}

function OpportunitySidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const [tab, setTab] = useState('opps')
  const money = updateSchedule.playerMoney || 0
  const buy = updateSchedule.handleBuyOpportunity
  const monitorData = updateSchedule.monitorData || { band, week: 1, hype: 0, drama: 0, money }
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>${money}</span></div><div className="sidekick-tabs"><button className={tab === 'routes' ? 'active' : ''} onClick={() => setTab('routes')}>ROUTES</button><button className={tab === 'gear' ? 'active' : ''} onClick={() => setTab('gear')}>GEAR</button><button className={tab === 'opps' ? 'active' : ''} onClick={() => setTab('opps')}>OPPS</button><button className={tab === 'store' ? 'active' : ''} onClick={() => setTab('store')}>STORE</button><button className={tab === 'story' ? 'active' : ''} onClick={() => setTab('story')}>STORY</button></div><div className="sidekick-lcd">{tab === 'opps' && <div><strong className="lcd-title">OPPORTUNITIES / ${money}</strong>{sidekickOpportunitiesCatalog.map((item) => <article className="gear-store-item" key={item.id}><strong>{item.name} · ${item.cost}</strong><span>{item.description}</span><button className="opp-buy" disabled={money < item.cost} onClick={() => buy(item)}>BOOK FEATURE</button></article>)}</div>}{tab === 'story' && <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE</strong>{narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>)}</div>}{tab === 'routes' && <div><strong className="lcd-title">COMPOUND ROUTES</strong>{activeMenuTarget === 'camera' ? <select className="lcd-select" value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow drama</option><option value="room:kitchen">Kitchen</option><option value="room:tracking">Tracking Room</option><option value="room:loading">Loading Dock</option><option value="room:desk">Producer Desk</option>{band.map((member) => <option value={member.id} key={member.id}>Follow {member.name}</option>)}</select> : band.map((member) => <article className="route-member" key={member.id}><strong>{member.name}</strong><div>{Object.entries({ kitchen: 'rest', tracking: 'groupJam', loading: 'smoke', desk: 'drink' }).map(([room, activity]) => <button key={room} onClick={() => updateSchedule(member.id, 'morning', activity)}>{room}</button>)}</div></article>)}</div>}{tab === 'gear' && <div><strong className="lcd-title">PERSONAL LOADOUTS</strong>{band.map((member) => <article className="member-loadout" key={member.id}><strong>{member.name}</strong>{Object.entries(member.equippedGear || {}).map(([slot, gearId]) => <label key={slot}><span>{slot}</span><select value={gearId || ''} onChange={(event) => updateSchedule(member.id, '__gear__', { slot, gearId: event.target.value || null })}><option value="">None</option>{masterGearList.filter((gear) => gear.slot === slot).map((gear) => <option value={gear.id} key={gear.id}>{gear.name}</option>)}</select></label>)}</article>)}</div>}{tab === 'store' && <div><strong className="lcd-title">FIELD GEAR STORE</strong>{masterGearList.map((gear) => <article className="gear-store-item" key={gear.id}><strong>{gear.name}</strong><span>{gear.description}</span></article>)}</div>}<div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setTab('opps')}>HOME</button><button className="sidekick-btn" onClick={() => setTab('opps')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div></div></aside>
}

function LoadoutSidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const [activeSidekickTab, setActiveSidekickTab] = useState('gear')
  const targetMember = band.find((member) => member.id === activeMenuTarget)
  const gearForSlot = (slot) => masterGearList.filter((gear) => gear.slot === slot)
  const tabs = [['monitor', 'HOME'], ['routes', 'ROUTES'], ['gear', 'LOADOUTS'], ['opps', 'OPPS'], ['store', 'STORE'], ['story', 'STORY']]
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>BAT 91%</span></div><div className="sidekick-tabs">{tabs.map(([id, label]) => <button className={activeSidekickTab === id ? 'active' : ''} onClick={() => setActiveSidekickTab(id)} key={id}>{label}</button>)}</div><div className="sidekick-lcd">{activeSidekickTab === 'routes' && <div><strong className="lcd-title">COMPOUND ROUTES</strong>{activeMenuTarget === 'camera' ? <div><p className="lcd-line">Send the camera crew directly to a room or follow the hottest story.</p><select className="lcd-select" value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow drama</option><option value="room:kitchen">Kitchen</option><option value="room:tracking">Tracking Room</option><option value="room:loading">Loading Dock</option><option value="room:desk">Producer Desk</option>{band.map((member) => <option value={member.id} key={member.id}>Follow {member.name}</option>)}<option value="off">Cut the feed</option></select></div> : <div>{band.map((member) => <article className="route-member" key={member.id}><strong>{member.name}</strong><small>{member.role}</small><div>{Object.entries({ kitchen: 'rest', tracking: 'groupJam', loading: 'smoke', desk: 'drink' }).map(([room, activity]) => <button className={member.schedule.morning === activity ? 'active' : ''} key={room} onClick={() => updateSchedule(member.id, 'morning', activity)}>{room}</button>)}</div></article>)}</div>}</div>}{activeSidekickTab === 'story' && <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE & DRAMA</strong>{narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>)}</div>}{activeSidekickTab === 'store' && <div><strong className="lcd-title">FIELD GEAR STORE</strong>{masterGearList.map((gear) => <article className="gear-store-item" key={gear.id}><strong>{gear.name}</strong><span>{gear.slot} · {gear.description}</span><b>{gear.modifier.hypeBonus ? `+${gear.modifier.hypeBonus} hype` : gear.modifier.dramaBonus ? `+${gear.modifier.dramaBonus} drama` : 'reliability kit'}</b></article>)}</div>}{activeSidekickTab === 'gear' && <div><strong className="lcd-title">BAND GEAR LOADOUTS</strong>{band.map((member) => <article className="member-loadout" key={member.id}><strong>{member.name.toUpperCase()} <small>({member.role})</small></strong>{Object.entries(member.equippedGear || {}).map(([slot, currentGearId]) => <label key={slot}><span>{slot}</span><select value={currentGearId || ''} onChange={(event) => updateSchedule(member.id, '__gear__', { slot, gearId: event.target.value || null })}><option value="">None</option>{gearForSlot(slot).map((gear) => <option value={gear.id} key={gear.id}>{gear.name}</option>)}</select></label>)}</article>)}</div>}<div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setActiveSidekickTab('routes')}>HOME</button><button className="sidekick-btn" onClick={() => setActiveSidekickTab('routes')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div></div></aside>
}

function PersonalSidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const [activeSidekickTab, setActiveSidekickTab] = useState('chat')
  const targetMember = band.find((member) => member.id === activeMenuTarget)
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>BAT 91%</span></div><div className="sidekick-tabs"><button className={activeSidekickTab === 'chat' ? 'active' : ''} onClick={() => setActiveSidekickTab('chat')}>MESSAGES</button><button className={activeSidekickTab === 'story' ? 'active' : ''} onClick={() => setActiveSidekickTab('story')}>STORY LOG</button></div><div className="sidekick-lcd">{activeSidekickTab === 'story' ? <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE & DRAMA</strong>{narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>)}</div> : targetMember ? <div><strong className="lcd-title">{targetMember.name.toUpperCase()}</strong><p className="lcd-line">{targetMember.role} · Stamina {targetMember.stamina}%</p><p className="lcd-line">Stress {targetMember.stress}% · Trust {targetMember.trust}%</p><div className="lcd-loadout"><p className="lcd-label">PERSONAL LOADOUT</p>{Object.entries(targetMember.equippedGear || {}).map(([slot, gearId]) => <div key={slot}><span>{slot}</span><b>{masterGearList.find((gear) => gear.id === gearId)?.name || 'None'}</b></div>)}</div><p className="lcd-label">CALL SHEET</p><div className="lcd-schedule">{['morning', 'noon', 'night'].map((slot) => <label key={slot}><span>{slot}</span><select value={targetMember.schedule[slot]} onChange={(event) => updateSchedule(targetMember.id, slot, event.target.value)}>{Object.entries(studioActivities).map(([key, activity]) => <option value={key} key={key}>{activity.label}</option>)}</select></label>)}</div></div> : <div><strong className="lcd-title">CAMERA CREW</strong><p className="lcd-line">Broadcast controls and volatility tracking.</p><select className="lcd-select" value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow drama</option>{band.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}<option value="off">Cut the feed</option></select></div>}<div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setActiveSidekickTab('chat')}>HOME</button><button className="sidekick-btn" onClick={() => setActiveSidekickTab('chat')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div></div></aside>
}

function SidekickPhone({ activeMenuTarget, band, cameraTarget, setCameraTarget, updateSchedule, closePhone, narrativeLog }) {
  const [activeSidekickTab, setActiveSidekickTab] = useState('chat')
  const targetMember = band.find((member) => member.id === activeMenuTarget)
  const roomActions = { kitchen: 'rest', tracking: 'groupJam', loading: 'smoke', desk: 'drink' }
  return <aside className="sidekick-device"><div className="sidekick-header"><span>SIDEKICK OS v1.2</span><i /><span>BAT 91%</span></div><div className="sidekick-tabs"><button className={activeSidekickTab === 'chat' ? 'active' : ''} onClick={() => setActiveSidekickTab('chat')}>MESSAGES</button><button className={activeSidekickTab === 'story' ? 'active' : ''} onClick={() => setActiveSidekickTab('story')}>STORY LOG</button></div><div className="sidekick-lcd">
    {targetMember && <div><strong className="lcd-title">{targetMember.name.toUpperCase()}</strong><p className="lcd-line">Stamina: {targetMember.stamina}% | Stress: {targetMember.stress}%</p><p className="lcd-line">Trust: {targetMember.trust}%</p><p className="lcd-status">{toCombatUnit(targetMember).statusEffects.join(' · ') || 'STABLE'}</p><p className="lcd-label">OVERRIDE ROOM ASSIGNMENT</p><div className="lcd-actions">{Object.entries(roomActions).map(([room, activity]) => <button className={targetMember.schedule.morning === activity ? 'active' : ''} key={room} onClick={() => updateSchedule(targetMember.id, 'morning', activity)}>Send to {room}{targetMember.schedule.morning === activity ? '  •' : ''}</button>)}</div><p className="lcd-label">CALL SHEET</p><div className="lcd-schedule">{['morning', 'noon', 'night'].map((slot) => <label key={slot}><span>{slot}</span><select value={targetMember.schedule[slot]} onChange={(event) => updateSchedule(targetMember.id, slot, event.target.value)}>{Object.entries(studioActivities).map(([key, activity]) => <option value={key} key={key}>{activity.label}</option>)}</select></label>)}</div></div>}
    {activeMenuTarget === 'camera' && <div><strong className="lcd-title">CAMERA CREW</strong><p className="lcd-line">Configure broadcast angles and follow the volatility.</p><p className="lcd-label">CAMERA TARGET</p><select className="lcd-select" value={cameraTarget} onChange={(event) => setCameraTarget(event.target.value)}><option value="auto">Auto-follow drama</option>{band.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}<option value="off">Cut the feed</option></select><div className="lcd-ratings"><span>HYPE <b>{Math.round(band.reduce((total, member) => total + member.trust, 0) / band.length)}</b></span><span>DRAMA <b>{Math.round(band.reduce((total, member) => total + member.stress, 0) / band.length)}</b></span></div></div>}
    <div className="lcd-story"><p className="lcd-label">STORY FEED</p>{narrativeLog?.slice(0, 4).map((entry) => <p key={entry.id}>{entry.text}</p>)}</div>{activeSidekickTab === 'story' && <div className="story-tab-panel"><strong className="lcd-title">EPISODE ARCHIVE & DRAMA</strong>{narrativeLog?.length ? narrativeLog.map((entry) => <article key={entry.id}><span>{entry.timestamp || 'Reality Feed'}</span><p>{entry.text}</p></article>) : <p>No recorded incidents yet. The cameras are rolling...</p>}</div>}
    <div className="sidekick-keypad"><button className="sidekick-btn" onClick={() => setActiveSidekickTab('chat')}>HOME</button><button className="sidekick-btn" onClick={() => setActiveSidekickTab('chat')}>BACK</button><button className="sidekick-btn close-btn" onClick={closePhone}>CLOSE X</button></div>
  </div></aside>
}

function SpinRoom({ episodeData, band, onChooseEdit }) {
  return <main className="spin-room"><p className="eyebrow">Episode one · Raw footage locked</p><h1>Spin the story.</h1><p className="spin-intro">The cameras got what they wanted. Choose the frame that Fairwell will carry into the Weekend Stage.</p><div className="spin-metrics"><span>Captured hype <b>{episodeData.hype}</b></span><span>Captured drama <b>{episodeData.drama}</b></span><span>Studio track <b>{episodeData.songProgress}%</b></span></div><div className="edit-grid"><EditChoice type="villain" title="Villain Edit" detail="Air the fracture. The network pays for a sharper story, but trust takes the hit." effects="+$350 payout · -8 trust · +8 drama" onChoose={onChooseEdit} /><EditChoice type="underdog" title="Underdog Edit" detail="Protect the band. Purists rally behind the comeback, and the stage starts warmer." effects="+$150 payout · +6 trust · +14 hype" onChoose={onChooseEdit} /></div><div className="spin-foot">{band.length} performers · {band.filter((member) => member.passedOut).length} unavailable · broadcast decision cannot be reversed</div></main>
}

function EditChoice({ type, title, detail, effects, onChoose }) {
  return <button className={`edit-choice ${type}`} onClick={() => onChoose(type)}><span className="edit-label">{type === 'villain' ? 'NETWORK FAVOURITE' : 'PURIST FAVOURITE'}</span><h2>{title}</h2><p>{detail}</p><strong>{effects}</strong><span className="edit-arrow">Choose edit →</span></button>
}

function EpisodeRecap({ episodeData, band, onReplay }) {
  return <main className="episode-recap"><p className="eyebrow">Episode one · Broadcast complete</p><h1>What survived?</h1><p className="recap-intro">Fairwell made it through the first public trial. The edit is now part of the band’s history.</p><div className="recap-score"><div><span>Network payout</span><strong>${episodeData.networkPayout.toLocaleString()}</strong></div><div><span>Hype / drama</span><strong>{episodeData.hype} / {episodeData.drama}</strong></div><div><span>Final edit</span><strong>{episodeData.editChoice}</strong></div></div><div className="recap-roster">{band.map((member) => <div className="recap-member" key={member.id}><strong>{member.name}</strong><span>{member.stamina}% stamina · {member.trust}% trust</span><em>{toCombatUnit(member).statusEffects.join(' · ') || 'Stable'}</em></div>)}</div><button className="replay-button" onClick={onReplay}>Start next episode <span>→</span></button></main>
}

function TransitionScreen({ band, hype, drama, payout, onEnterStage }) {
  return (
    <main className="transition-app">
      <header className="tactical-header"><div className="brand-lockup"><span className="brand-kicker">Remaking the Band</span><span className="brand-title">NETWORK CONTROL / COMMERCIAL BREAK</span></div><div className="transition-status">WEEKEND SET // READY</div></header>
      <section className="transition-hero"><p className="eyebrow">Episode one · Studio phase complete</p><h1>Cut to commercial.</h1><p>The network has counted the footage. Now Fairwell has to perform with what the week left behind.</p></section>
      <section className="transition-score"><div className="score-block"><span>Purist hype</span><strong>{hype}</strong><small>Music people are watching.</small></div><div className="score-block drama-score"><span>Trash TV drama</span><strong>{drama}</strong><small>The clip is already spreading.</small></div><div className="score-block payout-score"><span>Network payout</span><strong>${payout.toLocaleString()}</strong><small>Added to showrunner funds.</small></div></section>
      <section className="transition-report"><div className="report-heading"><div><span className="panel-label">01 / Consequence report</span><h2>What made it to the stage?</h2></div><span className="report-stamp">LIVE IN 30 SEC</span></div><div className="consequence-list">{band.map((member) => <ConsequenceCard key={member.id} member={member} />)}</div></section>
      <section className="handoff"><div><span className="panel-label">02 / Tactical handoff</span><h2>Every consequence is loaded.</h2><p>AP, MP, and status effects carry directly into the Weekend Stage. The crowd does not care how the week went.</p></div><button className="enter-stage" onClick={onEnterStage}>Enter Weekend Stage <span>→</span></button></section>
    </main>
  )
}

function ConsequenceCard({ member }) {
  const injury = member.passedOut ? 'Incapacitated' : member.stamina <= 15 ? 'Critical exhaustion' : member.stamina <= 25 ? 'Worn down' : 'No injury'
  const trustChange = member.trust - 50
  return <article className={`consequence-card ${member.color}`}><div className="consequence-name"><span className="unit-initials">{member.shortName}</span><div><strong>{member.name}</strong><small>{member.role}</small></div></div><div><span>Stamina</span><strong>{member.stamina}%</strong><small className={injury === 'No injury' ? '' : 'warning-text'}>{injury}</small></div><div><span>Trust change</span><strong className={trustChange >= 0 ? 'positive-text' : 'warning-text'}>{trustChange >= 0 ? '+' : ''}{trustChange}</strong><small>from studio baseline</small></div><div><span>Status effects</span><strong className="status-line">{member.statusEffects.length ? member.statusEffects.join(' · ') : 'Stable'}</strong><small>loaded for stage</small></div></article>
}

function StageCell({ cell, unit, selectedUnit, onSelect, onMove }) {
  const crowdSide = cell.col >= 5
  const hazard = cell.row === 2 && cell.col === 4
  const movable = !unit && !crowdSide && selectedUnit && Math.abs(cell.row - selectedUnit.position.row) + Math.abs(cell.col - selectedUnit.position.col) === 1
  return <button className={`stage-cell ${crowdSide ? 'crowd-cell' : ''} ${hazard ? 'hazard-cell' : ''} ${movable ? 'movable-cell' : ''}`} onClick={() => unit ? onSelect(unit.id) : onMove(cell)} aria-label={unit ? `Select ${unit.name}` : movable ? `Move to row ${cell.row + 1}, column ${cell.col + 1}` : `Stage tile ${cell.row + 1}, ${cell.col + 1}`}>
    {unit && <span className={`stage-unit ${unit.color} ${selectedUnit?.id === unit.id ? 'active-unit' : ''}`}><strong>{unit.shortName}</strong><small>{unit.role}</small></span>}
    {crowdSide && !unit && <span className="heckler">!</span>}
    {hazard && <span className="hazard">⚡</span>}
  </button>
}

export default App
