var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'tree_layout_chart',
    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            "node_modules"
        ]
    },
    output: {
        path: path.join(__dirname),
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
};