class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 }
  }) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.offset = offset
  }

  draw() {
    c.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    )
  }

  animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++
      } else {
        this.framesCurrent = 0
      }
    }
  }

  update() {
    this.draw()
    this.animateFrames()
  }
}

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined },
    facingRight = true // <--- اضافه شد: جهت پیش‌فرض اسپرایت
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })

    this.velocity = velocity
    this.width = 50
    this.height = 150
    this.lastKey
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: { x: attackBox.offset.x, y: attackBox.offset.y }, // <--- کپی شد
      width: attackBox.width,
      height: attackBox.height
    }
    // <--- اضافه شد: ذخیره مقدار اصلی offset برای فلیپ کردن
    this.originalAttackBoxOffsetX = attackBox.offset.x
    this.color = color
    this.isAttacking
    this.health = 100
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.sprites = sprites
    this.dead = false
    this.isOnGround = false

    // <--- اضافه شد: ویژگی‌های جهت‌گیری
    this.facingRight = facingRight       // جهت فعلی
    this.defaultFacingRight = facingRight // جهت پیش‌فرض اسپرایت

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
  }

  // <--- متد draw به‌طور کامل بازنویسی شد تا قابلیت فلیپ داشته باشد
  draw() {
    const frameWidth = this.image.width / this.framesMax
    const frameHeight = this.image.height
    const drawWidth = frameWidth * this.scale
    const drawHeight = frameHeight * this.scale

    // اگه جهت فعلی با جهت پیش‌فرض اسپرایت فرق داره، باید فلیپ کنیم
    const shouldFlip = this.facingRight !== this.defaultFacingRight

    c.save()

    if (shouldFlip) {
      // فلیپ افقی حول مرکز کاراکتر
      const centerX = this.position.x + this.width / 2
      c.translate(centerX, 0)
      c.scale(-1, 1)
      c.translate(-centerX, 0)
    }

    c.drawImage(
      this.image,
      this.framesCurrent * frameWidth,
      0,
      frameWidth,
      frameHeight,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      drawWidth,
      drawHeight
    )

    c.restore()
  }

  update() {
    this.draw()
    if (!this.dead) this.animateFrames()

    // <--- اضافه شد: فلیپ کردن attackBox بر اساس جهت‌گیری
    const shouldFlipAttack = this.facingRight !== this.defaultFacingRight
    if (!shouldFlipAttack) {
      this.attackBox.offset.x = this.originalAttackBoxOffsetX
    } else {
      // آینه‌ای کردن attackBox حول مرکز کاراکتر
      this.attackBox.offset.x =
        this.width - this.originalAttackBoxOffsetX - this.attackBox.width
    }

    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // محدودیت حرکت عمودی
    if (this.position.y < 0) {
      this.position.y = 0
      this.velocity.y = 0
    }

    // محدودیت حرکت افقی
    if (this.position.x < 0) {
      this.position.x = 0
      this.velocity.x = 0
    } else if (this.position.x > canvas.width - this.width) {
      this.position.x = canvas.width - this.width
      this.velocity.x = 0
    }

    // تشخیص زمین
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
      this.isOnGround = true
    } else {
      this.velocity.y += gravity
      this.isOnGround = false
    }
  }

  attack() {
    this.switchSprite('attack1')
    this.isAttacking = true
  }

  takeHit() {
    this.health -= 20

    if (this.health <= 0) {
      this.switchSprite('death')
    } else this.switchSprite('takeHit')
  }

  switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true
      return
    }

    if (
      this.image === this.sprites.attack1.image &&
      this.framesCurrent < this.sprites.attack1.framesMax - 1
    )
      return

    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return

    switch (sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image
          this.framesMax = this.sprites.run.framesMax
          this.framesCurrent = 0
        }
        break
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image
          this.framesMax = this.sprites.jump.framesMax
          this.framesCurrent = 0
        }
        break

      case 'fall':
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image
          this.framesMax = this.sprites.fall.framesMax
          this.framesCurrent = 0
        }
        break

      case 'attack1':
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break

      case 'takeHit':
        if (this.image !== this.sprites.takeHit.image) {
          this.image = this.sprites.takeHit.image
          this.framesMax = this.sprites.takeHit.framesMax
          this.framesCurrent = 0
        }
        break

      case 'death':
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image
          this.framesMax = this.sprites.death.framesMax
          this.framesCurrent = 0
        }
        break
    }
  }
}
