//model definition
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      booking_cost: { type: DataTypes.INTEGER, defaultValue: 0 },
      url: { type: DataTypes.STRING },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "locations",
      underscored: true,
      timestamps: true,
    } 
  );

  return Location;
};
