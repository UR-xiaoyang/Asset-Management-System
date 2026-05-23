package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

type EmailService struct {
	host     string
	port     int
	username string
	password string
	from     string
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	port := 587
	username := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = username
	}

	if host == "" {
		log.Println("[Email] SMTP not configured, emails will be logged only")
		return &EmailService{from: from}
	}

	return &EmailService{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     from,
	}
}

func (s *EmailService) Send(to, subject, body string) error {
	if s.host == "" {
		log.Printf("[Email] Mock send to %s: Subject: %s", to, subject)
		return nil
	}

	headers := make(map[string]string)
	headers["From"] = s.from
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	var message bytes.Buffer
	for k, v := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")
	message.WriteString(body)

	auth := smtp.PlainAuth("", s.username, s.password, s.host)
	err := smtp.SendMail(
		fmt.Sprintf("%s:%d", s.host, s.port),
		auth,
		s.from,
		[]string{to},
		message.Bytes(),
	)
	if err != nil {
		log.Printf("[Email] Failed to send to %s: %v", to, err)
		return err
	}
	log.Printf("[Email] Sent to %s: %s", to, subject)
	return nil
}

func (s *EmailService) SendBorrowApproval(to, assetName, assetUUID string, approved bool, reason string) error {
	var subject, body string
	if approved {
		subject = "借用申请已通过 - " + assetName
		body = fmt.Sprintf(`
			<html>
			<body>
				<h2>借用申请已通过</h2>
				<p>您好，</p>
				<p>您的借用申请已通过审核。</p>
				<table>
					<tr><td>资产名称：</td><td>%s</td></tr>
					<tr><td>资产编号：</td><td>%s</td></tr>
				</table>
				<p>请按照约定时间取用。</p>
				<hr>
				<p>此邮件由实验室资产管理系统自动发送</p>
			</body>
			</html>
		`, assetName, assetUUID)
	} else {
		subject = "借用申请被拒绝 - " + assetName
		body = fmt.Sprintf(`
			<html>
			<body>
				<h2>借用申请被拒绝</h2>
				<p>您好，</p>
				<p>很抱歉，您的借用申请未通过审核。</p>
				<table>
					<tr><td>资产名称：</td><td>%s</td></tr>
					<tr><td>资产编号：</td><td>%s</td></tr>
					<tr><td>拒绝原因：</td><td>%s</td></tr>
				</table>
				<p>如有疑问请联系管理员。</p>
				<hr>
				<p>此邮件由实验室资产管理系统自动发送</p>
			</body>
			</html>
		`, assetName, assetUUID, reason)
	}
	return s.Send(to, subject, body)
}

// SendEmailJSON 用于测试或通过外部API发送邮件的JSON格式
func (s *EmailService) SendEmailJSON(to, subject, body string) string {
	data := map[string]string{
		"to":      to,
		"subject": subject,
		"body":    body,
	}
	jsonData, _ := json.Marshal(data)
	return string(jsonData)
}

func (s *EmailService) IsConfigured() bool {
	return s.host != ""
}

// ExtractDomain 从邮箱地址提取域名用于SMTP认证
func ExtractDomain(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}
