//model definition
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      host_user_id: { type: DataTypes.INTEGER },
      location_id: { type: DataTypes.INTEGER },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATE, allowNull: false },
      budget: { type: DataTypes.INTEGER, defaultValue: 0 },
      available_pax: { type: DataTypes.INTEGER, allowNull: false },
      max_capacity: { type: DataTypes.INTEGER, allowNull: false },
      additional_fee: { type: DataTypes.INTEGER },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "events",
      underscored: true,
      timestamps: true,
    } 
  );

  return Event;
};
