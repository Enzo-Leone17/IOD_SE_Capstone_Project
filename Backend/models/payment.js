//model definition
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "cancelled", "complete"),
        allowNull: false,
        defaultValue: "pending",
      },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "payments",
      underscored: true,
      timestamps: true,
    }
  );

  return Payment;
};
