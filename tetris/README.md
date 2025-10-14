# Tetris Game

A classic Tetris game implementation using vanilla HTML, CSS, and JavaScript. This game features all the standard Tetris mechanics with modern enhancements like hold piece functionality and responsive design.

## 🎮 Features

### Core Gameplay
- **Classic Tetris Mechanics**: All 7 standard Tetris pieces (I, O, T, S, Z, J, L) with authentic colors
- **Piece Rotation**: Full 4-direction rotation for all pieces (except O-piece)
- **Line Clearing**: Complete horizontal lines are cleared with proper scoring
- **Level Progression**: Game speed increases every 10 lines cleared
- **Game Over Detection**: Game ends when pieces reach the top

### Modern Enhancements
- **Hold Piece**: Store a piece for later use (C key)
- **Next Piece Preview**: See the upcoming piece
- **Hard Drop**: Instantly drop pieces to the bottom (Spacebar)
- **Pause/Resume**: Pause the game at any time (P key)
- **Responsive Design**: Works on desktop and mobile devices

### Scoring System
- **Single Line**: 40 × level
- **Double Lines**: 100 × level  
- **Triple Lines**: 300 × level
- **Tetris (4 lines)**: 1200 × level

## 🎯 Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left/right |
| ↓ | Soft drop (faster fall) |
| ↑ | Rotate piece clockwise |
| **Spacebar** | Hard drop (instant drop) |
| **C** | Hold current piece |
| **P** | Pause/Resume game |

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software or dependencies required

### Installation & Setup

1. **Download the game files**:
   - `index.html` - Main game structure
   - `styles.css` - Game styling and layout
   - `tetris.js` - Game logic and mechanics

2. **Run the game**:
   - Open `index.html` in your web browser
   - Or serve the files using a local web server

3. **Start playing**:
   - Press **Spacebar** to begin
   - Use arrow keys to control pieces
   - Try to clear lines and achieve high scores!

## 📁 File Structure

\`\`\`
tetris-game/
├── index.html      # Main HTML structure and game UI
├── styles.css      # Styling, layout, and responsive design
├── tetris.js       # Complete game logic and mechanics
└── README.md       # This documentation file
\`\`\`

## 🏗️ Technical Implementation

### Architecture
- **Object-Oriented Design**: Game implemented as a single `Tetris` class
- **Canvas Rendering**: Uses HTML5 Canvas for smooth graphics
- **Event-Driven**: Keyboard input handling with proper game state management
- **Modular Code**: Separate methods for movement, rotation, line clearing, and rendering

### Key Components
- **Game Board**: 10×20 grid following standard Tetris dimensions
- **Piece System**: 7 unique tetromino shapes with rotation states
- **Collision Detection**: Prevents invalid moves and piece overlaps
- **Line Clearing Algorithm**: Efficiently removes completed lines
- **Scoring Engine**: Implements classic Tetris scoring rules

### Browser Compatibility
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Support**: Touch-friendly responsive design
- **No Dependencies**: Pure vanilla JavaScript implementation

## 🎨 Customization

### Modifying Colors
Edit the `colors` object in `tetris.js`:
\`\`\`javascript
this.colors = {
  I: "#00f0f0",  // Cyan
  O: "#f0f000",  // Yellow
  T: "#a000f0",  // Purple
  // ... modify as desired
}
\`\`\`

### Adjusting Game Speed
Modify the `dropInterval` calculation in the `clearLines()` method:
\`\`\`javascript
this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50)
\`\`\`

### Changing Board Size
Update the board dimensions (note: may require CSS adjustments):
\`\`\`javascript
this.BOARD_WIDTH = 10   // Standard width
this.BOARD_HEIGHT = 20  // Standard height
\`\`\`

## 🐛 Troubleshooting

### Common Issues
- **Game not starting**: Ensure all three files are in the same directory
- **Controls not working**: Click on the game area to ensure focus
- **Display issues**: Try refreshing the browser or clearing cache
- **Mobile controls**: Game is optimized for keyboard input on desktop

### Performance Tips
- Close other browser tabs for smoother gameplay
- Use a modern browser for best performance
- Ensure hardware acceleration is enabled

## 🤝 Contributing

This is a standalone implementation perfect for learning or modification. Feel free to:
- Add new features (ghost piece, different game modes)
- Improve the visual design
- Add sound effects and music
- Implement touch controls for mobile
- Add multiplayer functionality

## 📄 License

This project is open source and available under the MIT License. Feel free to use, modify, and distribute as needed.

## 🎯 Future Enhancements

Potential improvements for future versions:
- **Ghost Piece**: Show where the current piece will land
- **Sound Effects**: Audio feedback for movements and line clears
- **High Score System**: Local storage for best scores
- **Different Game Modes**: Sprint, Marathon, Puzzle modes
- **Themes**: Multiple visual themes and color schemes
- **Touch Controls**: Mobile-optimized touch interface
- **Multiplayer**: Local or online multiplayer support

---

**Enjoy playing Tetris!** 🎮✨
