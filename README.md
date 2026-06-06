# Xiuxian Game - Text-based Cultivation Game

A text-based cultivation (xiuxian) game inspired by Ghost Valley style, built with Flask and SQLite.

## Features

- Character creation and cultivation system
- Exploration and adventure events
- Combat system with critical hits
- Inventory and equipment management
- Skill learning and upgrading
- Web-based UI with real-time updates

## Tech Stack

- **Backend:** Flask + SQLite
- **Frontend:** HTML/CSS/JavaScript
- **Database:** SQLite with SQLAlchemy

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python app.py
```

Then open http://localhost:5000 in your browser.

## Project Structure

- `app.py` - Flask application entry point
- `game_engine.py` - Core game logic
- `routes.py` - Web routes
- `xiuxian_db.py` - Database models
- `engine/` - Game engine modules
- `static/` - CSS and JavaScript assets
- `templates/` - HTML templates
