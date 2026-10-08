import { useState } from 'react'
import Architecture from './Architecture.jsx'
const ID = { vpc: 'vpc-0a3f7c91e2b84d605', pub: 'subnet-0b7e41c2d9a38f176', pri: 'subnet-0c42d8e5a1f09b374', igw: 'igw-04d9a6b3e7c15f280', rpub: 'rtb-0e5b21a7c9d3f4860', rpri: 'rtb-07c8f3d1a5e29b4a1', rmain: 'rtb-02a96d4e8b1c7f353', sg: 'sg-0f18c3a9d5e74b2c6', ec2: 'i-0d62b8f4a1c9e7305', vol: 'vol-09c4e7a2d5b81f638', eip: '13.127.45.210' }
const P = ({ t, c = 'y', children }) => <section className="panel"><h3 className={c}>{t}</h3><div>{children}</div></section>
const T = ({ h, r }) => <div className="scroll"><table><tbody><tr>{h.map(x => <th key={x}>{x}</th>)}</tr>{r.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
const Ok = ({ children }) => <span className="tag" style={{ background: 'var(--g)' }}>{children}</span>
const KV = ({ a }) => <div className="grid cols" style={{ marginBottom: 0 }}>{a.map(([k, v]) => <div className="stat" key={k}><span>{k}</span><b style={{ fontSize: 16 }}>{v}</b></div>)}</div>
const Wrap = ({ t, children }) => <><h1>{t}</h1><div className="alert" style={{ background: 'var(--y)' }}>Simulated view. This imitates the AWS console using the project's Terraform design. Resource IDs and the IP address are examples, not from a live account.</div>{children}</>
const Bx = (x, y, t, s, c) => <g key={t}><rect x={x} y={y} width="210" height="52" fill={c} stroke="#111" strokeWidth="4" /><text x={x + 12} y={y + 22} fill="#111" fontSize="13" fontWeight="700">{t}</text><text x={x + 12} y={y + 41} fill="#111" fontSize="11" fontWeight="700">{s}</text></g>
const Map = () => <div className="scroll"><svg viewBox="0 0 760 310" style={{ minWidth: 600, width: '100%', color: 'var(--ink)' }} role="img" aria-label="Resource map: two subnets, three route tables, one internet gateway">
  <rect x="6" y="6" width="748" height="298" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="12 6" />
  <text x="20" y="30" fill="currentColor" fontSize="14" fontWeight="700">smart-spender-vpc · 10.0.0.0/16</text>
  <text x="34" y="80" fill="currentColor" fontSize="12" fontWeight="700">Subnets (2)</text><text x="300" y="80" fill="currentColor" fontSize="12" fontWeight="700">Route tables (3)</text><text x="540" y="80" fill="currentColor" fontSize="12" fontWeight="700">Network connections (1)</text>
  <g stroke="currentColor" strokeWidth="3"><line x1="244" y1="124" x2="300" y2="124" /><line x1="244" y1="194" x2="300" y2="194" /><line x1="510" y1="124" x2="540" y2="124" /></g>
  {Bx(34, 98, 'smart-spender-public', 'ap-south-1a · 10.0.1.0/24', '#6bcb77')}{Bx(34, 168, 'smart-spender-private', 'ap-south-1a · 10.0.2.0/24', '#b28dff')}
  {Bx(300, 98, 'smart-spender-public-rt', '0.0.0.0/0 → igw', '#4d96ff')}{Bx(300, 168, 'smart-spender-private-rt', 'local route only', '#4d96ff')}{Bx(300, 238, 'main route table', 'no subnets attached', '#cfcfcf')}
  {Bx(540, 98, 'smart-spender-igw', 'Attached', '#ff6b9d')}
</svg></div>

const PAGES = [
  ['Design', () => <Architecture />],
  ['VPC', () => <Wrap t="Your VPCs"><P t="Your VPCs (1)" c="b"><T h={['Name', 'VPC ID', 'State', 'IPv4 CIDR', 'DNS hostnames', 'Tenancy']} r={[['smart-spender-vpc', ID.vpc, <Ok>Available</Ok>, '10.0.0.0/16', 'Enabled', 'Default']]} /></P>
    <P t="Details"><KV a={[['VPC ID', ID.vpc], ['State', 'Available'], ['IPv4 CIDR', '10.0.0.0/16'], ['Total addresses', '65,536'], ['Main route table', ID.rmain], ['Region', 'ap-south-1 (Mumbai)']]} /></P>
    <P t="Resource map" c="g"><Map /></P></Wrap>],
  ['Subnets', () => <Wrap t="Subnets"><P t="Subnets (2)" c="b"><T h={['Name', 'Subnet ID', 'State', 'IPv4 CIDR', 'Available IPs', 'Zone', 'Auto-assign public IP']} r={[
    ['smart-spender-public', ID.pub, <Ok>Available</Ok>, '10.0.1.0/24', '250', 'ap-south-1a', 'Yes'],
    ['smart-spender-private', ID.pri, <Ok>Available</Ok>, '10.0.2.0/24', '251', 'ap-south-1a', 'No']]} /><p>A /24 holds 256 addresses and AWS reserves 5, so 251 are usable. The public subnet shows 250 because the EC2 server uses one.</p></P></Wrap>],
  ['Route tables', () => <Wrap t="Route tables"><P t="Route tables (3)" c="b"><T h={['Name', 'Route table ID', 'Subnet associations', 'Main']} r={[
    ['smart-spender-public-rt', ID.rpub, 'smart-spender-public', 'No'], ['smart-spender-private-rt', ID.rpri, 'smart-spender-private', 'No'], ['-', ID.rmain, '-', 'Yes']]} /></P>
    <P t="Routes: smart-spender-public-rt" c="g"><T h={['Destination', 'Target', 'Status']} r={[['10.0.0.0/16', 'local', <Ok>Active</Ok>], ['0.0.0.0/0', ID.igw, <Ok>Active</Ok>]]} /></P>
    <P t="Routes: smart-spender-private-rt" c="p"><T h={['Destination', 'Target', 'Status']} r={[['10.0.0.0/16', 'local', <Ok>Active</Ok>]]} /></P></Wrap>],
  ['Internet gateway', () => <Wrap t="Internet gateways"><P t="Internet gateways (1)" c="b"><T h={['Name', 'Internet gateway ID', 'State', 'VPC ID']} r={[['smart-spender-igw', ID.igw, <Ok>Attached</Ok>, ID.vpc]]} /></P></Wrap>],
  ['Security group', () => <Wrap t="Security groups"><P t="smart-spender-web" c="b"><T h={['Name', 'Security group ID', 'VPC ID', 'Inbound rules', 'Outbound rules']} r={[['smart-spender-web', ID.sg, ID.vpc, '2', '1']]} /></P>
    <P t="Inbound rules (2)" c="g"><T h={['Type', 'Protocol', 'Port', 'Source']} r={[['HTTP', 'TCP', '80', '0.0.0.0/0'], ['HTTPS', 'TCP', '443', '0.0.0.0/0']]} /><p>No rule for SSH (22) or MongoDB (27017).</p></P>
    <P t="Outbound rules (1)" c="p"><T h={['Type', 'Protocol', 'Port', 'Destination']} r={[['All traffic', 'All', 'All', '0.0.0.0/0']]} /></P></Wrap>],
  ['EC2', () => <Wrap t="Instances"><P t="Instances (1)" c="b"><T h={['Name', 'Instance ID', 'State', 'Type', 'Status check', 'Zone', 'Public IPv4']} r={[['smart-spender-app', ID.ec2, <Ok>Running</Ok>, 't3.micro', '2/2 passed', 'ap-south-1a', ID.eip]]} /></P>
    <P t="Instance details"><KV a={[['Private IPv4', '10.0.1.37'], ['Subnet', 'smart-spender-public'], ['Security group', 'smart-spender-web'], ['Elastic IP', ID.eip], ['IAM role', 'smart-spender-ec2-role'], ['Metadata', 'IMDSv2 required'], ['Monitoring', 'Detailed'], ['CPU alarm', 'smart-spender-cpu-high']]} /></P></Wrap>],
  ['EBS', () => <Wrap t="Volumes"><P t="Volumes (1)" c="b"><T h={['Name', 'Volume ID', 'Type', 'Size', 'State', 'Encryption', 'Attached to', 'Delete on termination']} r={[['smart-spender-app', ID.vol, 'gp3', '20 GiB', <Ok>In-use</Ok>, 'Encrypted', ID.ec2 + ' (/dev/sda1)', 'Yes']]} /></P></Wrap>]
]

export default function AwsConsole() {
  const [i, setI] = useState(0)
  return <>
    <div className="row" style={{ marginBottom: 22 }}>{PAGES.map(([n], k) => <button key={n} className={i === k ? 'y' : ''} style={{ boxShadow: i === k ? '2px 2px 0 #111' : undefined }} onClick={() => setI(k)}>{n}</button>)}</div>
    {PAGES[i][1]()}
  </>
}
