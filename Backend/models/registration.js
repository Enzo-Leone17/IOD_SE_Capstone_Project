//model definition
module.exports = (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    "Registration",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("scheduled", "cancelled", "completed"),
        allowNull: false,
      },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "registrations",
      underscored: true,
      timestamps: true,
    }
  );

  return Registration;
};
