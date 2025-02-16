 import { allSongs } from './isaifiles.js';

// Audio elements and state management
let currentIndex = 0;
let isPlaying = false;
let lastUpdateTime = 0;
const audioElements = [new Audio(), new Audio()];
let activeAudioIndex = 0;

// DOM elements
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const playlist = document.getElementById('playlist');

// Web Audio context maintenance
let audioContext;
let oscillator;

try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
  
  oscillator = audioContext.createOscillator();
  oscillator.connect(gainNode);
  oscillator.start();
} catch (e) {
  console.log('Web Audio API not supported:', e);
}

// Playlist population
function populatePlaylist() {
  playlist.innerHTML = allSongs.map((song, index) => `
    <li data-index="${index}" class="${index === 0 ? 'active' : ''}">
      ${song.file.replace('.mp3', '')}<br>
      <small>${song.details}</small>
    </li>
  `).join('');

  playlist.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => playSong(parseInt(li.dataset.index)));
  });
}

// Play/pause control
function togglePlayPause() {
  if (isPlaying) {
    audioElements.forEach(audio => audio.pause());
    isPlaying = false;
    playPauseBtn.textContent = '▶️';
  } else {
    const activeAudio = audioElements[activeAudioIndex];
    activeAudio.play()
      .then(() => {
        isPlaying = true;
        playPauseBtn.textContent = '⏸️';
      })
      .catch(error => {
        console.log('Playback error:', error);
        playPauseBtn.textContent = '▶️';
      });
  }
}

// Song playback management
function playSong(index) {
  currentIndex = index;
  const activeAudio = audioElements[activeAudioIndex];
  
  // Prevent duplicate loading
  if (activeAudio.src !== allSongs[currentIndex].path) {
    activeAudio.src = allSongs[currentIndex].path;
  }

  activeAudio.play()
    .then(() => {
      isPlaying = true;
      playPauseBtn.textContent = '⏸️';
      updateActiveSong();
      preloadNextTrack();
    })
    .catch(error => {
      console.log('Play error:', error);
      isPlaying = false;
      playPauseBtn.textContent = '▶️';
    });

  // Setup monitoring
  activeAudio.addEventListener('timeupdate', handleTimeUpdate);
  activeAudio.addEventListener('ended', switchToNextTrack);
}

// Next track handling
function playNextSong() {
  currentIndex = (currentIndex + 1) % allSongs.length;
  switchToNextTrack();
}

function switchToNextTrack() {
  const oldAudio = audioElements[activeAudioIndex];
  oldAudio.removeEventListener('timeupdate', handleTimeUpdate);
  oldAudio.removeEventListener('ended', switchToNextTrack);
  
  activeAudioIndex = 1 - activeAudioIndex;
  playSong(currentIndex);
}

// Preloading system
function preloadNextTrack() {
  const nextIndex = (currentIndex + 1) % allSongs.length;
  const inactiveAudio = audioElements[1 - activeAudioIndex];
  inactiveAudio.src = allSongs[nextIndex].path;
  inactiveAudio.load();
}

// Playback monitoring
function handleTimeUpdate() {
  const now = Date.now();
  const activeAudio = audioElements[activeAudioIndex];
  
  // Detect frozen playback (tab suspended)
  if (isPlaying && activeAudio.currentTime === lastUpdateTime) {
    if ((now - lastUpdateTime) > 1000) { // 1 second threshold
      console.log('Detected playback stall, advancing track');
      switchToNextTrack();
    }
  }
  
  lastUpdateTime = activeAudio.currentTime;
}

// UI updates
function updateActiveSong() {
  playlist.querySelectorAll('li').forEach(li => 
    li.classList.remove('active')
  );
  const activeItem = playlist.querySelector(`li[data-index="${currentIndex}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Visibility change handling
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isPlaying) {
    const activeAudio = audioElements[activeAudioIndex];
    if (activeAudio.paused) {
      activeAudio.play()
        .catch(error => console.log('Resume error:', error));
    }
  }
});

// Event listeners
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNextSong);

// Initial setup
populatePlaylist();
preloadNextTrack();

// Start with first song paused
audioElements[0].src = allSongs[0].path;
