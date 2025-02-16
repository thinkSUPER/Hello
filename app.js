 import { allSongs } from './isaifiles.js';

const audio = new Audio();
let currentIndex = 0;
let isPlaying = false;

const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const playlist = document.getElementById('playlist');

// Populate playlist
function populatePlaylist() {
    playlist.innerHTML = allSongs.map((song, index) => `
        <li data-index="${index}">
            ${song.file.replace('.mp3', '')}<br>
            <small>${song.details}</small>
        </li>
    `).join('');
    
    playlist.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => playSong(parseInt(li.dataset.index)));
    });
}

// Play/pause toggle
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playPauseBtn.textContent = '▶️';
    } else {
        audio.play();
        isPlaying = true;
        playPauseBtn.textContent = '⏸️';
    }
}

// Play specific song
function playSong(index) {
    currentIndex = index;
    audio.src = allSongs[currentIndex].path;
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = '⏸️';
    updateActiveSong();
}

// Play next song
function playNextSong() {
    currentIndex = (currentIndex + 1) % allSongs.length;
    playSong(currentIndex);
}

// Update active song styling
function updateActiveSong() {
    playlist.querySelectorAll('li').forEach(li => 
        li.classList.remove('active')
    );
    playlist.querySelector(`li[data-index="${currentIndex}"]`)
        .classList.add('active');
}

// Event listeners
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNextSong);

audio.addEventListener('ended', playNextSong);
audio.addEventListener('play', () => updateActiveSong());

// Initialize player
populatePlaylist();
playSong(0); // Start with first song paused

// Auto-scroll to active song
audio.addEventListener('play', () => {
    const activeItem = playlist.querySelector('.active');
    if (activeItem) {
        activeItem.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }
});
