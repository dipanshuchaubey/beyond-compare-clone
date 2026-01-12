# File Compare

A lightweight, web-based file comparison tool inspired by Beyond Compare. Compare files side-by-side with color-coded differences directly in your browser.

![File Compare](https://img.shields.io/badge/React-19.x-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **📂 Directory Browser**: Load and browse directories recursively from both left and right panels
- **🌳 File Tree View**: Expandable/collapsible file tree with visual icons
- **🔄 Side-by-Side Comparison**: View file differences in a split-screen layout
- **🎨 Color-Coded Diffs**: 
  - 🟢 **Green**: Added lines
  - 🔴 **Red**: Deleted lines
  - 🔵 **Blue**: Modified lines
- **⚡ Fast & Lightweight**: No heavy dependencies, pure inline styles
- **🚀 Simple Setup**: Quick installation with minimal configuration
- **🌐 REST API**: Backend API for file operations and comparisons

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Python difflib** - File comparison engine

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Pure CSS** - No external styling dependencies

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+ (or pnpm)
- Git

### Clone the Repository

```bash
git clone <repository-url>
cd file-compare
```

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install Python dependencies:
```bash
pip install fastapi uvicorn
```

3. Start the FastAPI server:
```bash
cd src
uvicorn server:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Start the development server:
```bash
pnpm dev
# or
npm run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Usage

1. **Open the Application**
   - Navigate to `http://localhost:5173` in your browser

2. **Load Directories**
   - Enter a directory path in the **Left Panel** input field (e.g., `/home/user/project/src`)
   - Click **"Load Directory"**
   - Repeat for the **Right Panel** with another directory path

3. **Browse Files**
   - Navigate through the file tree
   - 📁 Folders are expandable/collapsible
   - 📄 Click on any file to select it

4. **Compare Files**
   - Select one file from the left panel
   - Select one file from the right panel
   - Click **"🔍 Compare Selected Files"** button
   - View the side-by-side diff with highlighted changes

## 📡 API Endpoints

### `GET /api/files`
List all files in a directory recursively.

**Query Parameters:**
- `directory` (string): Absolute path to the directory

**Response:**
```json
{
  "name": "src",
  "path": "/path/to/src",
  "is_directory": true,
  "children": [...]
}
```

### `GET /api/file-content`
Get the content of a specific file.

**Query Parameters:**
- `file_path` (string): Absolute path to the file

**Response:**
```json
{
  "content": "file content here...",
  "path": "/path/to/file.txt"
}
```

### `POST /api/compare`
Compare two files and return diff information.

**Request Body:**
```json
{
  "file1_path": "/path/to/file1.txt",
  "file2_path": "/path/to/file2.txt"
}
```

**Response:**
```json
{
  "file1": "/path/to/file1.txt",
  "file2": "/path/to/file2.txt",
  "diff": [
    {
      "type": "equal",
      "line_number_left": 1,
      "line_number_right": 1,
      "content_left": "same line\n",
      "content_right": "same line\n"
    },
    {
      "type": "delete",
      "line_number_left": 2,
      "line_number_right": null,
      "content_left": "removed line\n",
      "content_right": null
    }
  ]
}
```

## 📁 Project Structure

```
file-compare/
├── client/                     # React frontend
│   ├── src/
│   │   ├── App.jsx            # Main application component
│   │   ├── App.css            # Application styles
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── index.html             # HTML template
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
│
├── server/                     # FastAPI backend
│   ├── src/
│   │   └── server.py          # API endpoints and logic
│   └── pyproject.toml         # Python project configuration
│
└── README.md                   # This file
```

## ⚙️ Configuration

### Backend Configuration

The FastAPI server is configured to:
- Run on port `8000`
- Enable CORS for `http://localhost:5173`
- Auto-reload on code changes (with `--reload` flag)

To change the port:
```bash
uvicorn server:app --reload --port 9000
```

### Frontend Configuration

Update CORS settings in `server/src/server.py` if using a different frontend port:
```python
allow_origins=["http://localhost:YOUR_PORT"]
```

## 🎯 Key Features Explained

### Directory Filtering
The application automatically filters out:
- Hidden files (starting with `.`)
- Common build directories (`node_modules`, `__pycache__`, `dist`, `build`)

### File Tree Rendering
- Directories are shown with 📁 icon
- Files are shown with 📄 icon
- Nested structure with proper indentation
- Selected files are highlighted in blue

### Diff Algorithm
Uses Python's `difflib.Differ` to:
- Detect line-by-line changes
- Identify insertions, deletions, and modifications
- Preserve line numbers for easy navigation
- Handle large files efficiently

## 🔧 Troubleshooting

### Blank Screen / UI Not Loading
1. Check browser console for errors (F12 → Console)
2. Verify both servers are running
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### CORS Errors
- Ensure backend is running on port 8000
- Check CORS configuration in `server/src/server.py`
- Verify frontend is accessing `http://localhost:8000`

### Port Already in Use
```bash
# Kill process on port 8000
kill $(lsof -t -i:8000)

# Kill process on port 5173
kill $(lsof -t -i:5173)
```

### Permission Denied
- Ensure you have read permissions for directories you're trying to access
- Run with appropriate user permissions

### Binary Files
- Only text files are supported
- Binary files will show an error message

## 🚧 Known Limitations

- Only supports text file comparison
- No support for directory comparison (files only)
- No merge functionality
- Limited to local file system access
- Requires manual directory path entry

## 🔮 Future Enhancements

- [ ] Directory-level comparison
- [ ] Inline editing capabilities
- [ ] Merge conflict resolution
- [ ] Search within diffs
- [ ] Export diff reports (HTML, PDF)
- [ ] Git integration
- [ ] Bookmark frequently used paths
- [ ] Custom color themes
- [ ] Multiple comparison tabs
- [ ] File upload support
- [ ] Syntax highlighting

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Notes

- Designed for local development and testing
- Not recommended for production use without additional security measures
- File paths are OS-dependent (use appropriate path separators)

## 🐛 Bug Reports

If you encounter any issues, please create an issue on the repository with:
- Detailed description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console error messages (if any)

---

**Made with ❤️ for developers who need a simple, fast file comparison tool**