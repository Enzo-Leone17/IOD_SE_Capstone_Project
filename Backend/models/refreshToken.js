//model definition
module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    "RefreshToken",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      token: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      expires_at: DataTypes.DATE,
    },
    {
      tableName: "refresh_tokens",
      underscored: true,
      timestamps: true,
    }
  );

  RefreshToken.associate = function (models) {
    RefreshToken.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  };

  return RefreshToken;
};
