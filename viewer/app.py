import os
from flask import Flask, jsonify, render_template
from workspace_loader import list_workspaces, load_workspace

app = Flask(__name__, static_folder='static', template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/workspace/<name>')
def workspace_page(name):
    if name not in list_workspaces():
        return "Workspace not found", 404
    return render_template('viewer.html', name=name)


@app.route('/api/workspaces')
def api_workspaces():
    workspaces = list_workspaces()
    return jsonify({'workspaces': workspaces})


@app.route('/api/workspace/<name>')
def api_workspace(name):
    data = load_workspace(name)
    if not data:
        return jsonify({'error': 'workspace not found'}), 404
    return jsonify(data)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
