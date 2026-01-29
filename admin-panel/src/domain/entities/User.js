class User {
    constructor({
        id = null,
        name,
        email,
        password,
        role = 'user',
        monthlyBuildLimit = 5,
        isActive = true,
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.monthlyBuildLimit = monthlyBuildLimit;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isAdmin() {
        return this.role === 'admin';
    }

    canBuild(currentMonthBuilds) {
        return currentMonthBuilds < this.monthlyBuildLimit;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            monthlyBuildLimit: this.monthlyBuildLimit,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromDatabase(row) {
        return new User({
            id: row.id,
            name: row.name,
            email: row.email,
            password: row.password,
            role: row.role,
            monthlyBuildLimit: row.monthly_build_limit,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }
}

module.exports = User;
