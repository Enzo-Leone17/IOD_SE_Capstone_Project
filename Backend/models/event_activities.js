//model definition
module.exports = (sequelize, DataTypes) => {
  const Event_Activity = sequelize.define(
    "Event_Activity",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: DataTypes.INTEGER,
      activity_id: DataTypes.INTEGER,
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "event_activities",
      underscored: true,
      timestamps: true,
    }
  );

  return Event_Activity;
};
