package model

import (
	"time"

	"gorm.io/gorm"
)

// Category 资产分类
type Category struct {
	gorm.Model
	ParentID  *uint  `gorm:"index;uniqueIndex:idx_cat_parent_name" json:"parent_id"` // 父级ID，空=顶级
	Name      string `gorm:"size:100;not null;uniqueIndex:idx_cat_parent_name" json:"name"`
	Label     string `gorm:"size:100" json:"label"` // 自定义标签
	SortOrder int    `gorm:"default:0" json:"sort_order"`

	// 关联
	Parent   *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

// Asset 资产
type Asset struct {
	gorm.Model
	UUID         string    `gorm:"uniqueIndex;size:36" json:"uuid"` // 唯一标识
	Name         string    `gorm:"size:200;not null" json:"name"`
	CategoryID   *uint     `gorm:"index" json:"category_id"`
	Spec         string    `gorm:"size:200" json:"spec"`      // 规格
	Quantity     int       `gorm:"default:1" json:"quantity"` // 数量
	Owner        string    `gorm:"size:100" json:"owner"`     // 所有人
	Location     string    `gorm:"size:200" json:"location"`  // 存放位置
	RegisteredBy string    `gorm:"size:100" json:"registered_by"`
	RegisteredAt time.Time `json:"registered_at"`

	// 关联
	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

// BorrowStatus 借用状态
type BorrowStatus string

const (
	BorrowStatusPending  BorrowStatus = "pending"  // 待审批
	BorrowStatusApproved BorrowStatus = "approved" // 已通过
	BorrowStatusRejected BorrowStatus = "rejected" // 已拒绝
	BorrowStatusReturned BorrowStatus = "returned" // 已归还
	BorrowStatusRevoked  BorrowStatus = "revoked"  // 已撤销（管理员撤回/拒绝后被撤销）
)

// BorrowRecord 借用记录
type BorrowRecord struct {
	gorm.Model
	AssetID       uint         `gorm:"index" json:"asset_id"`
	AssetUUID     string       `gorm:"size:36;index" json:"asset_uuid"`
	BorrowerID    *uint        `gorm:"index" json:"borrower_id"` // 关联用户ID（nullable，老数据保持NULL）
	BorrowerName  string       `gorm:"size:100" json:"borrower_name"`
	BorrowerEmail string       `gorm:"size:200" json:"borrower_email"`
	BorrowerPhone string       `gorm:"size:20" json:"borrower_phone"`
	Quantity      int          `json:"quantity"`
	BorrowDate    time.Time    `json:"borrow_date"`
	ReturnDate    *time.Time   `json:"return_date"` // 空=未归还
	Status        BorrowStatus `gorm:"size:20;default:pending" json:"status"`
	ApprovedBy    string       `gorm:"size:100" json:"approved_by"`
	ApprovedAt    *time.Time   `json:"approved_at"`
	RejectReason  string       `gorm:"size:500" json:"reject_reason"`
	Remark        string       `gorm:"size:500" json:"remark"`        // 备注
	RevokedAt     *time.Time   `json:"revoked_at"`                    // 撤销时间
	RevokedBy     string       `gorm:"size:100" json:"revoked_by"`    // 撤销操作人

	// 关联
	Asset *Asset `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	User  *User  `gorm:"foreignKey:BorrowerID" json:"user,omitempty"`
}

// UserRole 用户角色
type UserRole string

const (
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "super_admin"
	RoleVisitor    UserRole = "visitor"
)

// User 用户
type User struct {
	gorm.Model
	UUID         string   `gorm:"uniqueIndex;size:36" json:"uuid"`    // 访客UUID
	Username     string   `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string   `gorm:"size:255;not null" json:"-"`
	Name         string   `gorm:"size:100" json:"name"` // 真实姓名
	Email        string   `gorm:"size:200" json:"email"`
	Phone        string   `gorm:"size:20" json:"phone"` // 联系电话
	Role         UserRole `gorm:"size:20;default:visitor" json:"role"`
}

// OfflineRecord 离线借用记录（用于网络不可用时记录数据）
type OfflineRecord struct {
	gorm.Model
	AssetUUID     string    `gorm:"size:36;index" json:"asset_uuid"`
	BorrowerName  string    `gorm:"size:100" json:"borrower_name"`
	BorrowerPhone string    `gorm:"size:20" json:"borrower_phone"`
	Quantity      int       `json:"quantity"`
	RecordTime    time.Time `json:"record_time"`
	Synced        bool      `gorm:"default:false" json:"synced"` // 是否已同步
}

// SystemSetting 系统设置
type SystemSetting struct {
	gorm.Model
	Key      string `gorm:"uniqueIndex;size:100;not null" json:"key"` // 设置键
	Value    string `gorm:"type:text" json:"value"`                   // 设置值
	Category string `gorm:"size:50;default:general" json:"category"`  // 分类: general, email, system
	Label    string `gorm:"size:200" json:"label"`                    // 显示名称
}

// ConsumptionStatus 损耗状态
type ConsumptionStatus string

const (
	ConsumptionStatusPending   ConsumptionStatus = "pending"   // 待审批
	ConsumptionStatusApproved  ConsumptionStatus = "approved"  // 已批准
	ConsumptionStatusRejected  ConsumptionStatus = "rejected"  // 已拒绝
	ConsumptionStatusCompleted ConsumptionStatus = "completed" // 已完成（已登记用量）
	ConsumptionStatusRevoked   ConsumptionStatus = "revoked"   // 已撤销（恢复库存）
)

// Consumption 损耗记录（耗材使用OA流程）
type Consumption struct {
	gorm.Model
	AssetID        uint              `gorm:"index" json:"asset_id"`
	AssetUUID      string            `gorm:"size:36;index" json:"asset_uuid"`
	ReporterName   string            `gorm:"size:100" json:"reporter_name"`  // 损耗上报人
	ReporterEmail  string            `gorm:"size:200" json:"reporter_email"` // 上报人邮箱
	ProjectName    string            `gorm:"size:200" json:"project_name"`   // 使用项目名称
	Quantity       int               `json:"quantity"`                       // 损耗数量
	ConsumeDate    time.Time         `json:"consume_date"`                   // 损耗日期
	Status         ConsumptionStatus `gorm:"size:20;default:pending" json:"status"`
	ApprovedBy     string            `gorm:"size:100" json:"approved_by"`    // 审批人
	ApprovedAt     *time.Time        `json:"approved_at"`                    // 审批时间
	RejectReason   string            `gorm:"size:500" json:"reject_reason"`  // 拒绝原因
	ActualQuantity int               `json:"actual_quantity"`                // 实际用量（归还时填写）
	ProjectRecord  string            `gorm:"size:500" json:"project_record"` // 项目用量记录（归还时填写）
	Remark         string            `gorm:"size:500" json:"remark"`         // 备注
	RevokedAt      *time.Time        `json:"revoked_at"`                     // 撤销时间
	RevokedBy      string            `gorm:"size:100" json:"revoked_by"`     // 撤销操作人

	// 关联
	Asset *Asset `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
}
