const T = ({ h, r }) => <div className="scroll"><table><tbody><tr>{h.map(x => <th key={x}>{x}</th>)}</tr>{r.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
const P = ({ t, c = 'y', children }) => <section className="panel"><h3 className={c}>{t}</h3><div>{children}</div></section>

export default function Architecture() {
  const k = '#111'
  return <>
    <h1>AWS Setup</h1>
    <div className="alert" style={{ background: 'var(--y)' }}>This is the planned architecture from the project's Terraform file (infra/main.tf). Region: ap-south-1 (Mumbai). It is a design illustration, not live output from an AWS account.</div>
    <P t="Architecture diagram" c="b"><div className="scroll"><svg viewBox="0 0 760 540" style={{ minWidth: 600, width: '100%', color: 'var(--ink)' }} role="img" aria-label="Internet to Internet Gateway to VPC 10.0.0.0/16 with public subnet 10.0.1.0/24 and private subnet 10.0.2.0/24; MongoDB Atlas outside the VPC">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker></defs>
      <rect x="20" y="10" width="720" height="44" fill="#ffd93d" stroke={k} strokeWidth="4" /><text x="380" y="38" textAnchor="middle" fill={k} fontSize="17" fontWeight="700">Users on the Internet (browser)</text>
      <line x1="380" y1="56" x2="380" y2="88" stroke="currentColor" strokeWidth="4" markerEnd="url(#ar)" />
      <rect x="270" y="90" width="220" height="40" fill="#ff6b9d" stroke={k} strokeWidth="4" /><text x="380" y="115" textAnchor="middle" fill={k} fontSize="15" fontWeight="700">Internet Gateway (igw)</text>
      <line x1="380" y1="132" x2="380" y2="168" stroke="currentColor" strokeWidth="4" markerEnd="url(#ar)" />
      <rect x="20" y="150" width="720" height="300" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="14 6" />
      <rect x="30" y="156" width="300" height="22" fill="#4d96ff" stroke={k} strokeWidth="3" /><text x="40" y="172" fill={k} fontSize="13" fontWeight="700">VPC smart-spender-vpc · 10.0.0.0/16</text>
      <rect x="40" y="195" width="420" height="240" fill="#c9f2cf" stroke={k} strokeWidth="4" /><text x="52" y="217" fill={k} fontSize="14" fontWeight="700">Public subnet · 10.0.1.0/24 · 0.0.0.0/0 → igw</text>
      <rect x="55" y="228" width="390" height="195" fill="none" stroke={k} strokeWidth="3" strokeDasharray="8 5" /><text x="65" y="246" fill={k} fontSize="12" fontWeight="700">Security group: 80, 443 in · no SSH · no 27017</text>
      <rect x="70" y="256" width="200" height="150" fill="#fff" stroke={k} strokeWidth="4" />
      <text x="170" y="280" textAnchor="middle" fill={k} fontSize="14" fontWeight="700">EC2 t3.micro (Ubuntu)</text>
      <text x="170" y="304" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">nginx :80 → Node + Express :5000</text>
      <text x="170" y="324" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">serves the React build</text>
      <text x="170" y="348" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">PM2 keeps the app running</text>
      <text x="170" y="372" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">Reached via SSM, not SSH</text>
      <rect x="290" y="256" width="145" height="62" fill="#ffd93d" stroke={k} strokeWidth="4" /><text x="362" y="280" textAnchor="middle" fill={k} fontSize="13" fontWeight="700">EBS gp3 · 20 GB</text><text x="362" y="300" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">encrypted</text>
      <rect x="290" y="332" width="145" height="62" fill="#ff6b9d" stroke={k} strokeWidth="4" /><text x="362" y="356" textAnchor="middle" fill={k} fontSize="13" fontWeight="700">Elastic IP</text><text x="362" y="376" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">fixed public address</text>
      <rect x="480" y="195" width="250" height="110" fill="#e0dcff" stroke={k} strokeWidth="4" strokeDasharray="10 5" /><text x="605" y="222" textAnchor="middle" fill={k} fontSize="14" fontWeight="700">Private subnet · 10.0.2.0/24</text><text x="605" y="246" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">reserved for future services</text><text x="605" y="266" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">no internet route, no NAT</text>
      <rect x="480" y="320" width="250" height="115" fill="#ff5c4d" stroke={k} strokeWidth="4" /><text x="605" y="346" textAnchor="middle" fill={k} fontSize="14" fontWeight="700">IAM role + CloudWatch</text><text x="605" y="370" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">role: SSM + CloudWatch agent only</text><text x="605" y="390" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">logs, memory, disk metrics</text><text x="605" y="410" textAnchor="middle" fill={k} fontSize="12" fontWeight="700">CPU alarm at 80%</text>
      <line x1="170" y1="408" x2="170" y2="478" stroke="currentColor" strokeWidth="4" markerEnd="url(#ar)" />
      <rect x="40" y="480" width="420" height="44" fill="#6bcb77" stroke={k} strokeWidth="4" /><text x="250" y="507" textAnchor="middle" fill={k} fontSize="14" fontWeight="700">MongoDB Atlas (outside the VPC, TLS + IP allow-list)</text>
    </svg></div></P>
    <P t="VPC and CIDR plan"><T h={['Resource', 'Name', 'CIDR', 'Addresses', 'Why']} r={[
      ['VPC', 'smart-spender-vpc', '10.0.0.0/16', '65,536', 'Private range with room to grow'],
      ['Public subnet', 'smart-spender-public', '10.0.1.0/24', '256 (251 usable)', 'Holds the web server'],
      ['Private subnet', 'smart-spender-private', '10.0.2.0/24', '256 (251 usable)', 'Reserved for future services']]} /><p>AWS reserves 5 addresses per subnet, so a /24 gives 251 usable.</p></P>
    <P t="Routing" c="g"><T h={['Route table', 'Subnet', 'Routes']} r={[
      ['smart-spender-public-rt', '10.0.1.0/24', '10.0.0.0/16 → local, 0.0.0.0/0 → Internet Gateway'],
      ['smart-spender-private-rt', '10.0.2.0/24', '10.0.0.0/16 → local only']]} /></P>
    <P t="Security group: smart-spender-web-sg" c="p"><T h={['Direction', 'Port', 'Source', 'Purpose']} r={[
      ['Inbound', '80 HTTP', '0.0.0.0/0', 'Website traffic to nginx'],
      ['Inbound', '443 HTTPS', '0.0.0.0/0', 'Ready for a certificate'],
      ['Inbound', '22 SSH', 'Not open', 'Admin access uses AWS Systems Manager'],
      ['Inbound', '27017 MongoDB', 'Not open', 'Database is on Atlas, not on this network'],
      ['Outbound', 'All', '0.0.0.0/0', 'Reach Atlas, updates, CloudWatch']]} /></P>
    <P t="Other components" c="b"><T h={['Service', 'Configuration']} r={[
      ['EC2', 't3.micro, Ubuntu 24.04, IMDSv2 required, detailed monitoring'],
      ['EBS', '20 GB gp3, encrypted, deleted when the instance is terminated'],
      ['IAM', 'One role: SSM Managed Instance Core + CloudWatch Agent. No access keys on the server'],
      ['CloudWatch', 'nginx and app logs, memory and disk metrics, CPU alarm at 80%'],
      ['Elastic IP', 'Fixed address so the Atlas allow-list always matches'],
      ['Cost', 'About $10 to $15 a month while running. No NAT Gateway (saves about $32/month)']]} /></P>
  </>
}
