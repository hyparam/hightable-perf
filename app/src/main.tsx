import 'hightable/src/HighTable.css'
import ReactDOM from 'react-dom/client'
import { HighTable } from 'hightable'
import { data } from './data.js'
import './index.css'

const app = document.getElementById('app')
if (!app) throw new Error('missing app element')
ReactDOM.createRoot(app).render(<HighTable data={data} focus={true} />)
