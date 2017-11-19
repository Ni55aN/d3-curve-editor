import babel from 'rollup-plugin-babel';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    entry: 'src/index.js',
    dest: 'build/d3-curve-editor.js',
    sourceMap: true,
    plugins: [babel({
        presets: [
            [
                'es2015', {
                    'modules': false
                }
            ]
        ],
        plugins: ['external-helpers']
    }),
    sourcemaps()
    ],
    format: 'umd',
    moduleName: 'D3CE'
};