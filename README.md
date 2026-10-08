# Smart Spender
React (Vite) + Express 5 + MongoDB Atlas, deployed on AWS (VPC, EC2, EBS, IAM, CloudWatch via Terraform).
See the step-by-step guide in the chat; summary below.

1. Atlas: create free M0 cluster, DB user, copy connection string.
2. Local: `cd backend && cp .env.example .env` (fill it), `npm i && npm start`; in another terminal `cd frontend && npm i && npm run dev`; open http://localhost:5173
3. Push repo to GitHub.
4. AWS: `aws configure`, then `cd infra && terraform init && terraform apply`.
5. In Atlas > Network Access, add the `public_ip` output as /32.
6. `aws ssm start-session --target <instance_id>` then `sudo -i`, create /opt/smart-spender/backend/.env, run scripts/deploy.sh.
7. Open http://<public_ip>
8. Cleanup: `terraform destroy`.
