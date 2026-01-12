from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import difflib
from pathlib import Path
from typing import List, Optional


app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FileNode(BaseModel):
    name: str
    path: str
    is_directory: bool
    children: Optional[List['FileNode']] = None


class CompareRequest(BaseModel):
    file1_path: str
    file2_path: str


class DiffLine(BaseModel):
    type: str  # 'equal', 'insert', 'delete', 'replace'
    line_number_left: Optional[int]
    line_number_right: Optional[int]
    content_left: Optional[str]
    content_right: Optional[str]


@app.get("/")
async def hello():
    return {"message": "File Compare API"}


@app.get("/api/files")
async def list_files(directory: str):
    """Recursively list all files in a directory"""
    try:
        if not os.path.exists(directory):
            raise HTTPException(status_code=404, detail="Directory not found")
        
        if not os.path.isdir(directory):
            raise HTTPException(status_code=400, detail="Path is not a directory")
        
        def build_tree(path: str) -> FileNode:
            name = os.path.basename(path) or path
            is_dir = os.path.isdir(path)
            
            node = FileNode(
                name=name,
                path=path,
                is_directory=is_dir,
                children=None
            )
            
            if is_dir:
                try:
                    entries = sorted(os.listdir(path))
                    children = []
                    for entry in entries:
                        # Skip hidden files and common ignored directories
                        if entry.startswith('.') or entry in ['node_modules', '__pycache__', 'dist', 'build']:
                            continue
                        entry_path = os.path.join(path, entry)
                        children.append(build_tree(entry_path))
                    node.children = children
                except PermissionError:
                    node.children = []
            
            return node
        
        tree = build_tree(directory)
        return tree
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/file-content")
async def get_file_content(file_path: str):
    """Get the content of a file"""
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # Try to read as text file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"content": content, "path": file_path}
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File is not a text file")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compare")
async def compare_files(request: CompareRequest):
    """Compare two files and return diff information"""
    try:
        # Read both files
        if not os.path.exists(request.file1_path):
            raise HTTPException(status_code=404, detail=f"File 1 not found: {request.file1_path}")
        if not os.path.exists(request.file2_path):
            raise HTTPException(status_code=404, detail=f"File 2 not found: {request.file2_path}")
        
        try:
            with open(request.file1_path, 'r', encoding='utf-8') as f:
                content1 = f.readlines()
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File 1 is not a text file")
        
        try:
            with open(request.file2_path, 'r', encoding='utf-8') as f:
                content2 = f.readlines()
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File 2 is not a text file")
        
        # Generate diff
        differ = difflib.Differ()
        diff = list(differ.compare(content1, content2))
        
        # Process diff into structured format
        diff_lines = []
        left_line_num = 0
        right_line_num = 0
        
        i = 0
        while i < len(diff):
            line = diff[i]
            
            if line.startswith('  '):  # Equal lines
                left_line_num += 1
                right_line_num += 1
                diff_lines.append(DiffLine(
                    type='equal',
                    line_number_left=left_line_num,
                    line_number_right=right_line_num,
                    content_left=line[2:],
                    content_right=line[2:]
                ))
            elif line.startswith('- '):  # Deletion
                left_line_num += 1
                # Check if next line is an insertion (replacement)
                if i + 1 < len(diff) and diff[i + 1].startswith('+ '):
                    right_line_num += 1
                    diff_lines.append(DiffLine(
                        type='replace',
                        line_number_left=left_line_num,
                        line_number_right=right_line_num,
                        content_left=line[2:],
                        content_right=diff[i + 1][2:]
                    ))
                    i += 1  # Skip next line
                else:
                    diff_lines.append(DiffLine(
                        type='delete',
                        line_number_left=left_line_num,
                        line_number_right=None,
                        content_left=line[2:],
                        content_right=None
                    ))
            elif line.startswith('+ '):  # Insertion
                right_line_num += 1
                diff_lines.append(DiffLine(
                    type='insert',
                    line_number_left=None,
                    line_number_right=right_line_num,
                    content_left=None,
                    content_right=line[2:]
                ))
            
            i += 1
        
        return {
            "file1": request.file1_path,
            "file2": request.file2_path,
            "diff": [line.dict() for line in diff_lines]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))