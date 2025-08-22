//model definition
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define(
    "Activity",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM("sports", "charity", "games", "other"),
        allowNull: false,
        defaultValue: "other",
      },
      additional_notes: { type: DataTypes.STRING },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "activities",
      underscored: true,
      timestamps: true,
    }
  );

  return Activity;
};
